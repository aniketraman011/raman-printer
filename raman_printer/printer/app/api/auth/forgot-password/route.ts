import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { step, username, whatsappNumber, newPassword } = await request.json();

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({
      username: username.toLowerCase().trim(),
      isDeleted: false,
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No account found with this username' },
        { status: 404 }
      );
    }

    // Step 1: Verify username + WhatsApp number
    if (step === 'verify') {
      if (!whatsappNumber) {
        return NextResponse.json(
          { success: false, error: 'WhatsApp number is required' },
          { status: 400 }
        );
      }

      const cleanNumber = whatsappNumber.replace(/\D/g, '');
      if (cleanNumber !== user.whatsappNumber) {
        return NextResponse.json(
          { success: false, error: 'WhatsApp number does not match our records' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Identity verified. You can now set a new password.',
        verified: true,
      });
    }

    // Step 2: Reset password
    if (step === 'reset') {
      if (!whatsappNumber || !newPassword) {
        return NextResponse.json(
          { success: false, error: 'All fields are required' },
          { status: 400 }
        );
      }

      // Re-verify WhatsApp number
      const cleanNumber = whatsappNumber.replace(/\D/g, '');
      if (cleanNumber !== user.whatsappNumber) {
        return NextResponse.json(
          { success: false, error: 'Verification failed' },
          { status: 400 }
        );
      }

      // Validate new password
      if (newPassword.length < 8) {
        return NextResponse.json(
          { success: false, error: 'Password must be at least 8 characters long' },
          { status: 400 }
        );
      }

      // Hash and save new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      user.password = hashedPassword;
      await user.save();

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully. You can now login with your new password.',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid step' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
