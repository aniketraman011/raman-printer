import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    // PDF parsing disabled on Vercel due to canvas dependency issues
    // Return 0 to indicate page count must be entered manually
    return NextResponse.json({
      success: true,
      totalPages: 0,
      message: 'Automatic page detection is disabled. Please enter page count manually.',
    });
  } catch (error) {
    console.error('Page detection error:', error);
    return NextResponse.json({ totalPages: 0 });
  }
}
