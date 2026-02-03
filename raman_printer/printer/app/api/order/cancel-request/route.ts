import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ success: false, error: 'Invalid order ID' }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Verify order ownership - user can only cancel their own orders
    if (order.userId.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: 'You can only cancel your own orders' }, { status: 403 });
    }

    // Check if order can be cancelled - only PENDING orders
    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Only pending orders can be cancelled' },
        { status: 400 }
      );
    }

    if (order.cancelRequested) {
      return NextResponse.json(
        { success: false, error: 'Cancel request already submitted' },
        { status: 400 }
      );
    }

    order.cancelRequested = true;
    order.cancelRequestedAt = new Date();
    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Cancel request submitted successfully',
    });
  } catch (error: any) {
    console.error('Cancel request error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process cancel request' }, { status: 500 });
  }
}
