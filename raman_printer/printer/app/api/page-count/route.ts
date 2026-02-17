import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Count pages in a PDF buffer using raw binary parsing (no external deps)
function countPdfPages(buffer: Buffer): number {
  try {
    const text = buffer.toString('latin1');

    // Method 1: Look for /Count in root Pages dict (most reliable)
    // The /Pages dictionary usually has /Count <N> for total pages
    const countMatch = text.match(/\/Type\s*\/Pages[\s\S]*?\/Count\s+(\d+)/);
    if (countMatch) {
      const count = parseInt(countMatch[1], 10);
      if (count > 0) return count;
    }

    // Method 2: Count individual /Type /Page objects (not /Pages)
    const pageMatches = text.match(/\/Type\s*\/Page(?!s)\b/g);
    if (pageMatches && pageMatches.length > 0) {
      return pageMatches.length;
    }

    return 1;
  } catch (error) {
    console.error('PDF parse error:', error);
    return 1;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let formData;
    try {
      formData = await request.formData();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Failed to parse form data' },
        { status: 400 }
      );
    }

    const files = formData.getAll('files') as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    let totalPages = 0;
    const fileDetails: { name: string; pages: number; type: string }[] = [];

    for (const file of files) {
      if (!file) continue;

      let pages = 1;

      if (file.type === 'application/pdf') {
        try {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          pages = countPdfPages(buffer);
        } catch (err) {
          console.error(`Failed to count pages for ${file.name}:`, err);
          pages = 1;
        }
      }
      // For images, each image = 1 page
      // For DOC/DOCX, we default to 1 page (accurate count requires complex parsing)

      totalPages += pages;
      fileDetails.push({
        name: file.name,
        pages,
        type: file.type,
      });
    }

    return NextResponse.json({
      success: true,
      totalPages,
      fileDetails,
    });
  } catch (error: any) {
    console.error('Page count error:', error);
    return NextResponse.json(
      { error: 'Failed to count pages' },
      { status: 500 }
    );
  }
}
