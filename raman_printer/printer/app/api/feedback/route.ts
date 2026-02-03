import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import Feedback from '@/models/Feedback';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { message, rating } = await req.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Feedback message is required' }, { status: 400 });
    }

    // Limit message length
    if (message.length > 2000) {
      return NextResponse.json({ success: false, error: 'Feedback message must be less than 2000 characters' }, { status: 400 });
    }

    // Validate rating if provided
    if (rating !== undefined && rating !== null) {
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return NextResponse.json({ success: false, error: 'Rating must be between 1 and 5' }, { status: 400 });
      }
    }

    await connectDB();

    const feedback = await Feedback.create({
      userId: session.user.id,
      message: message.trim(),
      rating: rating || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback,
    });
  } catch (error: any) {
    console.error('Feedback submission error:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit feedback' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const feedbacks = await Feedback.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(50); // Limit results

    return NextResponse.json({
      success: true,
      feedbacks,
    });
  } catch (error: any) {
    console.error('Fetch feedbacks error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch feedbacks' }, { status: 500 });
  }
}
