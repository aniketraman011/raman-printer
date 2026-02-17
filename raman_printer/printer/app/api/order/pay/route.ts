import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Razorpay from 'razorpay';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await request.json();

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify ownership
    if (order.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Only allow payment for PENDING or UNPAID payment status
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({ error: 'Order is already paid' }, { status: 400 });
    }

    // Don't allow payment for cancelled orders
    if (order.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Cannot pay for a cancelled order' }, { status: 400 });
    }

    // Calculate the amount to charge: total minus what's already paid
    const alreadyPaid = order.paidAmount || 0;
    const amountToCharge = order.totalAmount - alreadyPaid;

    if (amountToCharge <= 0) {
      // Already fully paid, mark as PAID
      order.paymentStatus = 'PAID';
      await order.save();
      return NextResponse.json({ error: 'No pending amount to pay' }, { status: 400 });
    }

    try {
      const razorpay = new Razorpay({
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      });

      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(amountToCharge * 100), // amount in paise
        currency: 'INR',
        receipt: `pay_${orderId.slice(-8)}_${Date.now()}`,
      });

      // Update the order with new razorpay order id
      order.razorpayOrderId = razorpayOrder.id;
      await order.save();

      return NextResponse.json({
        success: true,
        razorpayOrderId: razorpayOrder.id,
        amount: amountToCharge,
        orderId: order._id.toString(),
        paidAmount: alreadyPaid,
        totalAmount: order.totalAmount,
      });
    } catch (rzpError: any) {
      console.error('Razorpay order creation error:', rzpError?.message || rzpError);
      return NextResponse.json(
        { error: 'Payment gateway error. Please try again.' },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error('Pay now error:', error);
    return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 });
  }
}
