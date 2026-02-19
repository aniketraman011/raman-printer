import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { getRazorpaySecret } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderIds } = await request.json();

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderIds || !Array.isArray(orderIds)) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment verification fields' },
        { status: 400 }
      );
    }

    // Verify payment signature (throws if RAZORPAY_KEY_SECRET is not configured)
    let razorpaySecret: string;
    try {
      razorpaySecret = getRazorpaySecret();
    } catch {
      console.error('RAZORPAY_KEY_SECRET is not configured');
      return NextResponse.json(
        { success: false, error: 'Payment verification configuration error' },
        { status: 500 }
      );
    }

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', razorpaySecret)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Payment verified - update all orders
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    let updatedCount = 0;
    for (const orderId of orderIds) {
      const order = await Order.findById(orderId);
      if (order && order.userId.toString() === session.user.id) {
        order.paymentStatus = 'PAID';
        order.razorpayPaymentId = razorpay_payment_id;
        order.paidAmount = order.totalAmount;
        await order.save();
        updatedCount++;
      }
    }

    return NextResponse.json({ success: true, updatedCount });
  } catch (error: any) {
    console.error('Pay-all verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
