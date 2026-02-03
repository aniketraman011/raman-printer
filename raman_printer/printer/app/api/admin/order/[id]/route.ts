import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ success: false, error: 'Invalid order ID' }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findById(params.id).populate('userId', 'fullName whatsappNumber');

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const userId = order.userId as any;

    return NextResponse.json({
      success: true,
      order: {
        _id: order._id,
        files: order.files,
        serviceItems: order.serviceItems,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        status: order.status,
        paymentStatus: order.paymentStatus,
        printSide: order.printSide,
        message: order.message,
        cancelRequested: order.cancelRequested,
        createdAt: order.createdAt,
        user: userId ? {
          fullName: userId.fullName,
          whatsappNumber: userId.whatsappNumber,
        } : null,
      },
    });
  } catch (error: any) {
    console.error('Get order error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch order' }, { status: 500 });
  }
}
