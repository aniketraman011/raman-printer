import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.username) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ username: session.user.username }).select('-password');

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        fullName: user.fullName,
        whatsappNumber: user.whatsappNumber,
        year: user.year,
        username: user.username,
      },
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.username) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { fullName, whatsappNumber, year } = await req.json();

    if (!fullName || !whatsappNumber || !year) {
      return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
    }

    // Validate inputs
    if (typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Full name must be at least 2 characters' }, { status: 400 });
    }

    // Validate WhatsApp number (10 digits)
    const cleanedNumber = whatsappNumber.replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleanedNumber)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid 10-digit WhatsApp number' }, { status: 400 });
    }

    // Validate year
    const validYears = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Passout'];
    if (!validYears.includes(year)) {
      return NextResponse.json({ success: false, error: 'Please select a valid year' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ username: session.user.username });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    user.fullName = fullName.trim();
    user.whatsappNumber = cleanedNumber;
    user.year = year;
    await user.save();

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}
