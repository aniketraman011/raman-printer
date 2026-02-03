import { NextRequest, NextResponse } from 'next/server';
const pdfParse = require('pdf-parse');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ totalPages: 0 });
    }

    let totalPages = 0;

    for (const file of files) {
      if (!file || file.type !== 'application/pdf') continue;

      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const pdfData = await pdfParse(buffer);
        totalPages += pdfData.numpages || 0;
      } catch (error) {
        console.error('PDF parsing error for', file.name, error);
        // Continue with other files
      }
    }

    return NextResponse.json({
      success: true,
      totalPages,
    });
  } catch (error) {
    console.error('Page detection error:', error);
    return NextResponse.json({ totalPages: 0 });
  }
}
