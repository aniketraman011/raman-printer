import { NextResponse } from 'next/server';
import { getSettings } from '@/app/actions/settings';

export async function GET() {
  try {
    const settings = await getSettings();
    
    return NextResponse.json({
      isCodEnabled: settings.isCodEnabled,
      isServiceAvailable: settings.isServiceAvailable,
      adminContactName: settings.adminContactName,
      adminContactPhone: settings.adminContactPhone,
      serviceItems: settings.serviceItems,
    });
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
