import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import Feedback from '@/models/Feedback';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { reply } = await req.json();

    if (!reply || reply.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Reply is required' }, { status: 400 });
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
