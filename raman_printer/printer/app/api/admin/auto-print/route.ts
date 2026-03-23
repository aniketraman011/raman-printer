import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Settings from '@/models/Settings';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { print } from 'pdf-to-printer';
import { ensurePdf } from '@/lib/fileConverter';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    
    // Check if Auto-Print is enabled
    const settings = await Settings.findOne();
    if (!settings || !settings.isAutoPrintEnabled) {
      return NextResponse.json({ success: true, printed: 0, status: 'disabled' });
    }

    // This route is no longer responsible for actual printing when deployed on Vercel.
    // actual printing is handled by the local print-worker.js.
    // We just return a success message so the frontend doesn't crash if it calls this.
    return NextResponse.json({ success: true, message: 'Auto-print runs locally via print-worker.js', printed: 0 });
  } catch (error) {
    console.error('Auto-Print Daemon Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to run print worker' }, { status: 500 });
  }
}
