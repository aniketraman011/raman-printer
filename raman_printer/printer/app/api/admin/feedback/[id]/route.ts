import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import Feedback from '@/models/Feedback';
import mongoose from 'mongoose';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ success: false, error: 'Invalid feedback ID' }, { status: 400 });
    }

    const { reply } = await req.json();

    if (!reply || typeof reply !== 'string' || reply.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Reply is required' }, { status: 400 });
    }

    // Limit reply length
    if (reply.length > 1000) {
      return NextResponse.json({ success: false, error: 'Reply must be less than 1000 characters' }, { status: 400 });
    }

    await connectDB();

    const feedback = await Feedback.findById(params.id);

    if (!feedback) {
      return NextResponse.json({ success: false, error: 'Feedback not found' }, { status: 404 });
    }

    feedback.adminReply = reply.trim();
    feedback.adminRepliedAt = new Date();
    await feedback.save();

    return NextResponse.json({
      success: true,
      message: 'Reply submitted successfully',
    });
  } catch (error: any) {
    console.error('Reply feedback error:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit reply' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ success: false, error: 'Invalid feedback ID' }, { status: 400 });
    }

    await connectDB();

    const feedback = await Feedback.findByIdAndDelete(params.id);

    if (!feedback) {
      return NextResponse.json({ success: false, error: 'Feedback not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete feedback error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete feedback' }, { status: 500 });
  }
}
