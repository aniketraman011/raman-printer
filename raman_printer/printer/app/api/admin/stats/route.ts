import { NextResponse } from 'next/server';
import { getAdminStats } from '@/app/actions/user';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await getAdminStats();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Admin stats API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
