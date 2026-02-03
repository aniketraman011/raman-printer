'use server';

import { auth } from '@/auth';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { revalidatePath } from 'next/cache';

export async function createOrder(data: {
  files: Array<{fileName: string; fileUrl: string; fileSize: number}>;
  serviceItems: Array<{name: string; price: number; quantity: number}>;
  totalAmount: number;
  paymentMethod: 'RAZORPAY' | 'COD';
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    await connectDB();

    const order = await Order.create({
      userId: session.user.id,
      files: data.files,
      serviceItems: data.serviceItems,
      totalAmount: data.totalAmount,
      paymentMethod: data.paymentMethod,
      status: 'PENDING',
      paymentStatus: data.paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
    });

    // Increment total orders counter in Settings
    const Settings = (await import('@/models/Settings')).default;
    await Settings.findOneAndUpdate(
      {},
      { $inc: { totalOrders: 1 } },
      { upsert: true }
    );

    // Create an OrderLog entry for permanent tracking (survives order deletion)
    const OrderLog = (await import('@/models/OrderLog')).default;
    await OrderLog.create({
      orderId: order._id,
      totalAmount: data.totalAmount,
      createdAt: order.createdAt,
    });

    return {
      success: true,
      orderId: order._id.toString(),
    };
  } catch (error: any) {
    console.error('Create order error:', error);
    return { success: false, error: error.message || 'Failed to create order' };
  }
}

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

    const User = (await import('@/models/User')).default;

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

    await connectDB();

    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const oldStatus = order.status;
    
    // Update order status
    await Order.findByIdAndUpdate(orderId, { status });

    const Settings = (await import('@/models/Settings')).default;

    // Update permanent counters based on status change
    if (status === 'COMPLETED' && oldStatus !== 'COMPLETED') {
      // Increment completed orders counter
      await Settings.findOneAndUpdate(
        {},
        { $inc: { completedOrders: 1 } },
        { upsert: true }
      );

      // If payment is PAID, add to revenue
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

    await connectDB();

    // Get the order first to access file paths
    const order = await Order.findById(orderId);
    
    if (order && order.files && order.files.length > 0) {
      // Delete physical files from uploads folder
      const fs = require('fs');
      const path = require('path');
      
      for (const file of order.files) {
        try {
          // Extract filename from fileUrl (e.g., /uploads/filename.pdf -> filename.pdf)
          const fileName = file.fileUrl.split('/').pop();
          if (fileName) {
            const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
            
            // Check if file exists before deleting
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`Deleted file: ${fileName}`);
            }
          }
        } catch (fileError) {
          console.error(`Error deleting file ${file.fileName}:`, fileError);
          // Continue with other files even if one fails
        }
      }
    }

    // Delete the order from database
    await Order.findByIdAndDelete(orderId);

    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('Delete order error:', error);
    return { success: false, error: error.message || 'Failed to delete order' };
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

    const oldPaymentStatus = order.paymentStatus;

    const updateData: any = {
      paymentStatus: 'PAID',
    };

    // Only add Razorpay IDs if provided (for online payments)
    if (razorpayOrderId) {
      updateData.razorpayOrderId = razorpayOrderId;
    }
    if (razorpayPaymentId) {
      updateData.razorpayPaymentId = razorpayPaymentId;
    }

    await Order.findByIdAndUpdate(orderId, updateData);

    // If payment just became PAID and order is COMPLETED, add to permanent revenue
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
