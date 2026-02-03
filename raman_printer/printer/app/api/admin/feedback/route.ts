import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import Feedback from '@/models/Feedback';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const feedbacks = await Feedback.find()
      .populate('userId', 'fullName whatsappNumber')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      feedbacks,
    });
  } catch (error: any) {
    console.error('Fetch feedbacks error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
