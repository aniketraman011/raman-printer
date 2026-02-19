import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { getRazorpayClient } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find all unpaid/partially paid orders for this user (not cancelled)
    const orders = await Order.find({
      userId: session.user.id,
      paymentStatus: { $ne: 'PAID' },
      status: { $ne: 'CANCELLED' },
    });

    if (orders.length === 0) {
      return NextResponse.json({ error: 'No unpaid orders found' }, { status: 400 });
    }

    // Calculate total remaining balance across all orders
    let totalRemaining = 0;
    const orderIds: string[] = [];

    for (const order of orders) {
      const paid = order.paidAmount || 0;
      const remaining = order.totalAmount - paid;
      if (remaining > 0) {
        totalRemaining += remaining;
        orderIds.push(order._id.toString());
      }
    }

    if (totalRemaining <= 0) {
      return NextResponse.json({ error: 'No remaining balance to pay' }, { status: 400 });
    }

    try {
      const razorpay = getRazorpayClient();

      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalRemaining * 100), // amount in paise
        currency: 'INR',
        receipt: `payall_${session.user.id.slice(-8)}_${Date.now()}`,
        notes: {
          type: 'pay_all',
          orderIds: orderIds.join(','),
        },
      });

      return NextResponse.json({
        success: true,
        razorpayOrderId: razorpayOrder.id,
        amount: totalRemaining,
        orderIds,
        orderCount: orderIds.length,
      });
    } catch (rzpError: any) {
      console.error('Razorpay order creation error:', rzpError?.message || rzpError);
      return NextResponse.json(
        { error: 'Payment gateway error. Please try again.' },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error('Pay all error:', error);
    return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 });
  }
}
