'use server';

import { auth } from '@/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function registerUser(formData: FormData) {
  try {
    const fullName = formData.get('fullName') as string;
    const whatsappNumber = formData.get('whatsappNumber') as string;
    const year = formData.get('year') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!fullName || !whatsappNumber || !year || !username || !password) {
      return { success: false, error: 'All fields are required' };
    }

    await connectDB();

    // Check if username already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return { success: false, error: 'Username already taken' };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await User.create({
      fullName,
      whatsappNumber,
      year,
      username: username.toLowerCase(),
      password: hashedPassword,
      role: 'USER',
      isVerified: false,
      isDeleted: false,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Registration error:', error);
    return { success: false, error: error.message || 'Registration failed' };
  }
}

export async function getAdminStats() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    await connectDB();

    const Order = (await import('@/models/Order')).default;
    const Settings = (await import('@/models/Settings')).default;
    const OrderLog = (await import('@/models/OrderLog')).default;

    // Get current date for 24h calculation
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Get settings for permanent counters
    let settings = await Settings.findOne();
    
    // If settings don't exist, create with defaults
    if (!settings) {
      settings = await Settings.create({});
    }

    // Check if OrderLog needs migration (orders exist but OrderLog is empty)
    const orderLogCount = await OrderLog.countDocuments({});
    const orderCount = await Order.countDocuments({});
    
    if (orderCount > 0 && orderLogCount === 0) {
      // Migrate existing orders to OrderLog for permanent tracking
      const existingOrders = await Order.find({}, { _id: 1, totalAmount: 1, createdAt: 1 }).lean();
      const orderLogEntries = existingOrders.map(order => ({
        orderId: order._id,
        totalAmount: order.totalAmount || 0,
        createdAt: order.createdAt,
      }));
      
      if (orderLogEntries.length > 0) {
        await OrderLog.insertMany(orderLogEntries, { ordered: false }).catch(() => {
          // Ignore duplicate errors if migration runs multiple times
        });
      }
    }

    const [
      pendingOrders,
      printingOrders,
      unpaidOrders,
      // Use OrderLog for time-based counts (survives order deletion)
      recentOrderLogs,
      todayOrderLogs,
      // Check if OrderLog collection has any entries (to decide fallback)
      totalOrderLogs,
      totalUsers,
      verifiedUsers,
      pendingVerifications,
      // Count from DB for fallback
      dbCompletedOrders,
      dbCancelledOrders,
      dbPaidRevenue,
      // Fallback: count from Order if OrderLog is empty (for existing orders before OrderLog was added)
      recentOrdersFallback,
      todayOrdersFallback,
      totalOrdersFallback,
    ] = await Promise.all([
      Order.countDocuments({ status: 'PENDING' }),
      Order.countDocuments({ status: 'PRINTING' }),
      Order.find({ paymentStatus: { $in: ['UNPAID', 'PENDING'] } }),
      // Count from permanent OrderLog collection (survives deletion)
      OrderLog.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } }),
      OrderLog.countDocuments({ createdAt: { $gte: todayStart } }),
      // Total OrderLog entries (to check if migration happened)
      OrderLog.countDocuments({}),
      User.countDocuments({ role: 'USER', isDeleted: false }),
      User.countDocuments({ isVerified: true, isDeleted: false, role: 'USER' }),
      User.countDocuments({ isVerified: false, isDeleted: false, role: 'USER' }),
      // Fallback counts from database
      Order.countDocuments({ status: 'COMPLETED' }),
      Order.countDocuments({ status: 'CANCELLED' }),
      Order.aggregate([
        { $match: { paymentStatus: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      // Fallback for existing orders without OrderLog entries
      Order.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } }),
      Order.countDocuments({ createdAt: { $gte: todayStart } }),
      Order.countDocuments({}),
    ]);
    
    // Determine if OrderLog is being used (has any entries) or if we need fallback
    // Once OrderLog has entries, always use it (even if time-based counts are 0)
    const useOrderLog = totalOrderLogs > 0;
    
    // For time-based stats: use OrderLog if it has any entries, otherwise fallback
    const recentOrders = useOrderLog ? recentOrderLogs : recentOrdersFallback;
    const todayOrders = useOrderLog ? todayOrderLogs : todayOrdersFallback;

    // For Total Orders: Use Settings.totalOrders if set, otherwise use OrderLog count or fallback
    // Settings.totalOrders is the permanent counter that only increments
    let totalOrders = settings.totalOrders;
    if (!totalOrders || totalOrders === 0) {
      // Initialize from OrderLog if available, otherwise from Order collection
      totalOrders = useOrderLog ? totalOrderLogs : totalOrdersFallback;
      // Save this initial value to Settings so it persists
      if (totalOrders > 0) {
        await Settings.findOneAndUpdate(
          {},
          { $set: { totalOrders: totalOrders } },
          { upsert: true }
        );
      }
    }
    const completedOrders = settings.completedOrders || dbCompletedOrders;
    const cancelledOrders = settings.cancelledOrders || dbCancelledOrders;
    const totalRevenue = settings.totalRevenue || (dbPaidRevenue[0]?.total || 0);
    
    // Calculate pending revenue (UNPAID + PENDING payment status)
    const pendingRevenue = unpaidOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    return {
      success: true,
      stats: {
        totalOrders,
        pendingOrders: pendingOrders + printingOrders, // Include printing in pending for attention
        completedOrders,
        cancelledOrders,
        totalRevenue,
        pendingRevenue,
        verifiedUsers,
        totalUsers,
        pendingVerifications,
        recentOrders,
        todayOrders,
      },
    };
  } catch (error: any) {
    console.error('Get admin stats error:', error);
    return { success: false, error: error.message || 'Failed to fetch stats' };
  }
}

export async function getAllUsers() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    await connectDB();

    const users = await User.find()
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      users: JSON.parse(JSON.stringify(users)),
    };
  } catch (error: any) {
    console.error('Get all users error:', error);
    return { success: false, error: error.message || 'Failed to fetch users' };
  }
}

export async function updateUserVerification(userId: string, isVerified: boolean) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    await connectDB();

    await User.findByIdAndUpdate(userId, { isVerified });

    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Update user verification error:', error);
    return { success: false, error: error.message || 'Failed to update verification' };
  }
}

export async function softDeleteUser(userId: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    await connectDB();

    // Hard delete user from database
    await User.findByIdAndDelete(userId);

    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('Delete user error:', error);
    return { success: false, error: error.message || 'Failed to delete user' };
  }
}

// Restore function removed - deletion is now permanent
