import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Check if user is deleted or not verified
    const user = await User.findById(session.user.id);
    if (!user || user.isDeleted) {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact admin.' },
        { status: 403 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { error: 'Your account is pending verification. Please wait for admin approval.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { files, serviceItems, totalAmount, paymentMethod, printSide, message } = body;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    if (!serviceItems || serviceItems.length === 0) {
      return NextResponse.json(
        { error: 'No service items provided' },
        { status: 400 }
      );
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid total amount' },
        { status: 400 }
      );
    }

    if (!paymentMethod || !['RAZORPAY', 'COD'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    if (!printSide || !['SINGLE', 'DOUBLE'].includes(printSide)) {
      return NextResponse.json(
        { error: 'Invalid print side option' },
        { status: 400 }
      );
    }

    // Create Razorpay order if payment method is RAZORPAY
    let razorpayOrderId = null;
    if (paymentMethod === 'RAZORPAY') {
      try {
        const razorpay = new Razorpay({
          key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
          key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        const razorpayOrder = await razorpay.orders.create({
          amount: totalAmount * 100, // amount in paise
          currency: 'INR',
          receipt: `order_${Date.now()}`,
        });

        razorpayOrderId = razorpayOrder.id;
      } catch (rzpError) {
        console.error('Razorpay order creation error:', rzpError);
        // Continue without Razorpay order ID if creation fails
      }
    }

    const order = await Order.create({
      userId: session.user.id,
      files,
      serviceItems,
      totalAmount,
      paymentMethod,
      razorpayOrderId,
      printSide,
      message: message || undefined,
      status: 'PENDING',
      paymentStatus: paymentMethod === 'COD' ? 'UNPAID' : 'PENDING',
    });

    return NextResponse.json({
      success: true,
      orderId: order._id.toString(),
      razorpayOrderId,
      userName: session.user.name || '',
    });
  } catch (error: any) {
    console.error('Create order API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
