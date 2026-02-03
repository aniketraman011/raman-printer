import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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
        user: {
          fullName: userId.fullName,
          whatsappNumber: userId.whatsappNumber,
        },
      },
    });
  } catch (error: any) {
    console.error('Get order error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
