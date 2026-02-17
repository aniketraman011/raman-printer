'use server';

import { auth } from '@/auth';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import mongoose from 'mongoose';
import { revalidatePath } from 'next/cache';

export async function getUserOrders() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    await connectDB();

    const orders = await Order.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      orders: JSON.parse(JSON.stringify(orders)),
    };
  } catch (error: any) {
    console.error('Get user orders error:', error);
    return { success: false, error: error.message || 'Failed to fetch orders' };
  }
}

export async function getAllOrders() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    await connectDB();

    const orders = await Order.find()
      .populate('userId', 'fullName username whatsappNumber')
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      orders: JSON.parse(JSON.stringify(orders)),
    };
  } catch (error: any) {
    console.error('Get all orders error:', error);
    return { success: false, error: error.message || 'Failed to fetch orders' };
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate status value
    const validStatuses = ['PENDING', 'PRINTING', 'READY', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return { success: false, error: 'Invalid order status' };
    }

    await connectDB();

    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const oldStatus = order.status;
    
    // Update order status (and mark cancelApprovedByAdmin if cancelling)
    const updateData: any = { status };
    if (status === 'CANCELLED') {
      updateData.cancelApprovedByAdmin = true;
    }
    await Order.findByIdAndUpdate(orderId, updateData);

    const Settings = (await import('@/models/Settings')).default;

    // Update permanent counters based on status change (only increment, never decrement)
    if (status === 'COMPLETED' && oldStatus !== 'COMPLETED') {
      // Increment completed orders counter
      await Settings.findOneAndUpdate(
        {},
        { $inc: { completedOrders: 1 } },
        { upsert: true }
      );

      // If payment is already PAID, add to revenue (status=COMPLETED + payment=PAID)
      if (order.paymentStatus === 'PAID') {
        await Settings.findOneAndUpdate(
          {},
          { $inc: { totalRevenue: order.totalAmount } },
          { upsert: true }
        );
      }
    }

    if (status === 'CANCELLED' && oldStatus !== 'CANCELLED') {
      // Increment cancelled orders counter
      await Settings.findOneAndUpdate(
        {},
        { $inc: { cancelledOrders: 1 } },
        { upsert: true }
      );
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('Update order status error:', error);
    return { success: false, error: error.message || 'Failed to update status' };
  }
}

export async function deleteOrder(orderId: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate MongoDB ObjectId
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return { success: false, error: 'Invalid order ID' };
    }

    await connectDB();

    // Get the order first to access file paths
    const order = await Order.findById(orderId);
    
    if (!order) {
      return { success: false, error: 'Order not found' };
    }
    
    if (order.files && order.files.length > 0) {
      for (const file of order.files) {
        try {
          const fileUrl = file.fileUrl;
          
          // Check if it's a Vercel Blob URL
          if (fileUrl.includes('blob.vercel-storage.com') || fileUrl.includes('public.blob.vercel-storage.com')) {
            // Delete from Vercel Blob storage
            try {
              const { del } = await import('@vercel/blob');
              await del(fileUrl);
              console.log(`Deleted Vercel Blob file: ${file.fileName}`);
            } catch (blobError) {
              console.error(`Error deleting Vercel Blob file ${file.fileName}:`, blobError);
            }
          } else if (fileUrl.startsWith('/uploads/')) {
            // Delete local file from uploads folder
            const fs = require('fs');
            const path = require('path');
            const fileName = fileUrl.split('/').pop();
            if (fileName) {
              const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
              
              // Check if file exists before deleting
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted local file: ${fileName}`);
              }
            }
          }
        } catch (fileError) {
          console.error(`Error deleting file ${file.fileName}:`, fileError);
          // Continue with other files even if one fails
        }
      }
    }

    // Delete the order from database
    // Note: OrderLog entry is NOT deleted to keep dashboard counters permanent (always increasing)
    await Order.findByIdAndDelete(orderId);

    revalidatePath('/admin');
    revalidatePath('/admin/orders');
    return { success: true };
  } catch (error: any) {
    console.error('Delete order error:', error);
    return { success: false, error: 'Failed to delete order' };
  }
}

export async function updatePaymentStatus(
  orderId: string,
  razorpayOrderId?: string,
  razorpayPaymentId?: string
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    await connectDB();

    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    // Verify ownership: only the order owner or admin can update payment
    if (order.userId.toString() !== session.user.id && session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    const oldPaymentStatus = order.paymentStatus;

    const updateData: any = {
      paymentStatus: 'PAID',
      paidAmount: order.totalAmount, // Mark the full amount as paid
    };

    // Only add Razorpay IDs if provided (for online payments)
    if (razorpayOrderId) {
      updateData.razorpayOrderId = razorpayOrderId;
    }
    if (razorpayPaymentId) {
      updateData.razorpayPaymentId = razorpayPaymentId;
    }

    await Order.findByIdAndUpdate(orderId, updateData);

    // If payment just became PAID and order is already COMPLETED, add to revenue
    // Revenue only updates when BOTH status=COMPLETED AND payment=PAID
    if (oldPaymentStatus !== 'PAID' && order.status === 'COMPLETED') {
      const Settings = (await import('@/models/Settings')).default;
      await Settings.findOneAndUpdate(
        {},
        { $inc: { totalRevenue: order.totalAmount } },
        { upsert: true }
      );
    }

    revalidatePath('/dashboard/history');
    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('Update payment status error:', error);
    return { success: false, error: error.message || 'Failed to update payment status' };
  }
}
