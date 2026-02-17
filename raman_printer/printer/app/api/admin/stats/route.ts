import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAdminStats } from '@/app/actions/user';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Auth guard at route level (getAdminStats also checks internally)
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
