import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import { getRazorpayClient } from '@/lib/razorpay';

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
    const { files, serviceItems, totalAmount, paymentMethod, printSide, message, pages, copies } = body;

    const hasFiles = files && files.length > 0;
    const hasServices = serviceItems && serviceItems.length > 0;

    // Require either files or service items
    if (!hasFiles && !hasServices) {
      return NextResponse.json(
        { error: 'Please provide files or select at least one service' },
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

    // Only validate print settings if files are provided
    if (hasFiles && (!printSide || !['SINGLE', 'DOUBLE'].includes(printSide))) {
      return NextResponse.json(
        { error: 'Invalid print side option' },
        { status: 400 }
      );
    }

    // Check if service is available
    const Settings = (await import('@/models/Settings')).default;
    const settings = await Settings.findOne();
    if (settings && !settings.isServiceAvailable) {
      return NextResponse.json(
        { error: settings.serviceUnavailableMessage || 'Service is currently unavailable.' },
        { status: 503 }
      );
    }

    // Create Razorpay order if payment method is RAZORPAY
    let razorpayOrderId = null;
    if (paymentMethod === 'RAZORPAY') {
      try {
        const razorpay = getRazorpayClient();

        const razorpayOrder = await razorpay.orders.create({
          amount: Math.round(totalAmount * 100), // amount in paise
          currency: 'INR',
          receipt: `order_${Date.now()}`,
        });

        razorpayOrderId = razorpayOrder.id;
      } catch (rzpError) {
        console.error('Razorpay order creation error:', rzpError);
        return NextResponse.json(
          { error: 'Payment gateway error. Please try again or use Cash on Delivery.' },
          { status: 502 }
        );
      }
    }

    const order = await Order.create({
      userId: session.user.id,
      ...(hasFiles ? { files } : {}),
      serviceItems: serviceItems || [],
      ...(hasFiles ? { pages: pages || undefined, copies: copies || undefined, printSide } : {}),
      totalAmount,
      paymentMethod,
      razorpayOrderId,
      message: message || undefined,
      status: 'PENDING',
      paymentStatus: paymentMethod === 'COD' ? 'UNPAID' : 'PENDING',
    });

    // Increment total orders counter in Settings
    await Settings.findOneAndUpdate(
      {},
      { $inc: { totalOrders: 1 } },
      { upsert: true }
    );

    // Create an OrderLog entry for permanent tracking (survives order deletion)
    const OrderLog = (await import('@/models/OrderLog')).default;
    await OrderLog.create({
      orderId: order._id,
      totalAmount,
      createdAt: order.createdAt,
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
