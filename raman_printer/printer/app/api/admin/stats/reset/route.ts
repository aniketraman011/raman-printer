import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import Settings from '@/models/Settings';
import OrderLog from '@/models/OrderLog';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin password
    const { password } = await req.json();
    
    if (!password) {
      return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 });
    }

    await connectDB();

    // Get admin user and verify password
    const adminUser = await User.findById(session.user.id);
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Admin user not found' }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(password, adminUser.password);
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, error: 'Incorrect password' }, { status: 401 });
    }

    // Reset Settings counters - only reset totalOrders counter
    // Other stats (completed, cancelled, revenue) are always fetched from database in real-time
    const Order = (await import('@/models/Order')).default;
    
    const totalOrderLogs = await OrderLog.countDocuments({});

    await Settings.findOneAndUpdate(
      {},
      {
        $set: {
          totalOrders: totalOrderLogs,
        },
        $unset: {
          completedOrders: "",
          cancelledOrders: "",
          totalRevenue: "",
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Dashboard stats reset successfully',
    });
  } catch (error: any) {
    console.error('Reset stats error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
