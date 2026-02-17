import { NextResponse } from 'next/server';
import { getSettings } from '@/app/actions/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getSettings();
    
    const response = NextResponse.json({
      isCodEnabled: settings.isCodEnabled,
      isServiceAvailable: settings.isServiceAvailable,
      serviceUnavailableMessage: settings.serviceUnavailableMessage || '',
      adminContactName: settings.adminContactName,
      adminContactPhone: settings.adminContactPhone,
      adminContactAddress: settings.adminContactAddress || '',
      globalMessage: settings.globalMessage || '',
      serviceItems: settings.serviceItems,
    });

    // Cache for 30 seconds to reduce DB load, but allow revalidation
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

    return response;
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
