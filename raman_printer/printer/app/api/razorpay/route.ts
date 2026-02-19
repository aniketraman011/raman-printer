import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = await request.json();

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment verification fields' },
        { status: 400 }
      );
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify Razorpay secret is configured
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('RAZORPAY_KEY_SECRET is not configured');
      return NextResponse.json(
        { success: false, error: 'Payment verification configuration error' },
        { status: 500 }
      );
    }

    // Verify payment signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Payment verified - update order status
    await connectDB();
    
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Ensure the order belongs to the authenticated user
    if (order.userId.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    order.paymentStatus = 'PAID';
    order.razorpayPaymentId = razorpay_payment_id;
    // After successful payment, user has paid the full current total
    // (Pay Now API always charges exactly totalAmount - paidAmount)
    order.paidAmount = order.totalAmount;
    await order.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Razorpay verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
