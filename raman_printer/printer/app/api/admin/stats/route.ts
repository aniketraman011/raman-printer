import { NextResponse } from 'next/server';
import { getAdminStats } from '@/app/actions/user';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await getAdminStats();
  return NextResponse.json(result);
}
