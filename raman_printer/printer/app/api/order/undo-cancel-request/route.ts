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

    // Verify order ownership - user can only modify their own orders
    if (order.userId.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: 'You can only modify your own orders' }, { status: 403 });
    }

    // Check if cancel was already approved by admin
    if (order.cancelApprovedByAdmin) {
      return NextResponse.json(
        { success: false, error: 'Cancellation already approved by admin. Cannot undo.' },
        { status: 400 }
      );
    }

    // Remove cancel request
    order.cancelRequested = false;
    order.cancelRequestedAt = undefined;
    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Cancel request removed successfully',
    });
  } catch (error: any) {
    console.error('Remove cancel request error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
}
