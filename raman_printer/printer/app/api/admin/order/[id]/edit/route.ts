import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import mongoose from 'mongoose';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ success: false, error: 'Invalid order ID' }, { status: 400 });
    }

    await connectDB();

    const body = await req.json();
    const { pages, copies, serviceItems, totalAmount } = body;

    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Save the original total for comparison BEFORE updating
    const originalTotal = order.totalAmount;

    // Update fields
    if (pages !== undefined) {
      order.pages = Math.max(1, pages);
    }
    if (copies !== undefined) {
      order.copies = Math.max(1, copies);
    }
    if (serviceItems !== undefined) {
      order.serviceItems = serviceItems;
    }
    if (totalAmount !== undefined) {
      order.totalAmount = totalAmount;
    }

    // Recalculate payment status based on new total vs what's been paid
    if (totalAmount !== undefined && totalAmount !== originalTotal) {
      // If order was marked PAID but paidAmount was never set (legacy/COD), treat as fully paid at original amount
      const alreadyPaid = (order.paidAmount || 0) > 0 ? order.paidAmount : (order.paymentStatus === 'PAID' ? originalTotal : 0);
      order.paidAmount = alreadyPaid; // Ensure paidAmount is stored

      if (alreadyPaid > 0 && totalAmount <= alreadyPaid) {
        // New total is less than or equal to what they already paid — mark as PAID
        order.paymentStatus = 'PAID';
        order.paidAmount = totalAmount; // cap paidAmount at new total (no overpayment stored)
      } else if (alreadyPaid > 0 && totalAmount > alreadyPaid) {
        // New total exceeds what they paid — remaining balance due
        order.paymentStatus = 'PENDING';
      } else if (alreadyPaid === 0 && order.paymentStatus === 'PAID') {
        // Was marked paid (e.g. COD verified) but amount changed — re-set to PENDING
        order.paymentStatus = 'PENDING';
      }
      // If alreadyPaid === 0 and status is UNPAID/PENDING, leave as-is
    }

    await order.save();

    // Update the OrderLog if amount changed
    if (totalAmount !== undefined) {
      const OrderLog = (await import('@/models/OrderLog')).default;
      await OrderLog.findOneAndUpdate(
        { orderId: order._id },
        { totalAmount },
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        _id: order._id,
        pages: order.pages,
        copies: order.copies,
        serviceItems: order.serviceItems,
        totalAmount: order.totalAmount,
        paidAmount: order.paidAmount || 0,
        paymentStatus: order.paymentStatus,
      },
    });
  } catch (error: any) {
    console.error('Update order error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}
