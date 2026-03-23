import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Settings from '@/models/Settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    
    // Find orders that need printing:
    // 1. If Auto-Print is ON: PENDING orders older than delay
    // 2. OR orders manually set to PRINTING (e.g. via Print Now button)

    const query: any = {
      cancelRequested: false
    };

    const conditions = [];

    if (settings && settings.isAutoPrintEnabled) {
      const delaySeconds = settings.autoPrintDelaySeconds !== undefined ? settings.autoPrintDelaySeconds : 10;
      const delayAgo = new Date(Date.now() - delaySeconds * 1000);
      conditions.push({
        status: 'PENDING',
        createdAt: { $lte: delayAgo }
      });
    }

    // Also pick up any orders manually pushed to PRINTING state
    conditions.push({ status: 'PRINTING', printedAt: null });

    if (conditions.length > 0) {
      query.$or = conditions;
    } else {
      return NextResponse.json({ success: true, orders: [] });
    }

    const orders = await Order.find(query);

    // Mark PENDING ones as PRINTING so they aren't grabbed twice
    for (const order of orders) {
      if (order.status === 'PENDING') {
        order.status = 'PRINTING';
        order.printedAt = null; // Ensure printedAt is null so it gets picked up if it fails and restarts
        await order.save();
      }
    }

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('Pending Prints Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
