import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import connectDB from '@/lib/db';
import Order from '@/models/Order';

const razorpay = new Razorpay({
  key_id: 'rzp_live_SB2OLoFt68Gc2C',
  key_secret: '48XkDW65QjD7QkChRX2BY1xO',
});

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = await request.json();

    // Verify payment signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', '48XkDW65QjD7QkChRX2BY1xO')
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
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'PAID',
      razorpayPaymentId: razorpay_payment_id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Razorpay verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
