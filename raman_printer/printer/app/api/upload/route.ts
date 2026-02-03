import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import crypto from 'crypto';

// Configure route for large file uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for file upload

// Sanitize filename to prevent path traversal
function sanitizeFilename(filename: string): string {
  // Remove path separators and null bytes
  return filename.replace(/[\/\\:\*\?"<>\|]/g, '_').replace(/\0/g, '');
}

// Generate secure unique filename
function generateSecureFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString('hex');
  const sanitizedName = sanitizeFilename(originalName);
  const extension = sanitizedName.split('.').pop()?.toLowerCase() || 'bin';
  return `${timestamp}-${randomBytes}.${extension}`;
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to upload files.' },
        { status: 401 }
      );
    }

    let formData;
    try {
      formData = await request.formData();
    } catch (parseError: any) {
      console.error('FormData parsing error:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse form data. File may be too large or request malformed.' },
        { status: 400 }
      );
    }
    
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate maximum number of files (10 files max)
    if (files.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 files allowed per upload' },
        { status: 400 }
      );
    }

    // Validate total size (100MB max)
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxTotalSize = 100 * 1024 * 1024; // 100MB
    if (totalSize > maxTotalSize) {
      return NextResponse.json(
        { error: 'Total file size exceeds 100MB limit' },
        { status: 400 }
      );
    }

    const uploadedFiles = [];
    
    // Check environment
    const isVercelDeployment = process.env.VERCEL === '1';
    const hasVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
    
    // On Vercel, Blob storage is required
    if (isVercelDeployment && !hasVercelBlob) {
      console.error('Vercel Blob storage not configured. BLOB_READ_WRITE_TOKEN is missing.');
      return NextResponse.json(
        { error: 'File storage is not configured. Please contact administrator.' },
        { status: 500 }
      );
    }

    for (const file of files) {
      if (!file) continue;

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
      ];

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Only PDF, DOC, and image files allowed.` },
          { status: 400 }
        );
      }

      // Validate individual file size (20MB max per file)
      const maxSize = 20 * 1024 * 1024; // 20MB per file
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Maximum size per file is 20MB.` },
          { status: 400 }
        );
      }

      // Generate secure unique filename
      const uniqueFilename = generateSecureFilename(file.name);

      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      let fileUrl: string;
      
      if (isVercelDeployment) {
        // Upload to Vercel Blob storage
        try {
          const { put } = await import('@vercel/blob');
          const blob = await put(uniqueFilename, buffer, {
            access: 'public',
            contentType: file.type,
          });
          fileUrl = blob.url;
        } catch (uploadError: any) {
          console.error('Blob upload error:', uploadError);
          return NextResponse.json(
            { error: `Failed to upload file: ${file.name}. Please try again.` },
            { status: 500 }
          );
        }
      } else {
        // Local development: save to public/uploads
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        
        // Ensure upload directory exists
        if (!existsSync(uploadDir)) {
          mkdirSync(uploadDir, { recursive: true });
        }
        
        const filePath = join(uploadDir, uniqueFilename);
        
        try {
          await writeFile(filePath, buffer);
          fileUrl = `/uploads/${uniqueFilename}`;
        } catch (writeError: any) {
          console.error('File write error:', writeError);
          return NextResponse.json(
            { error: `Failed to save file: ${file.name}. Please try again.` },
            { status: 500 }
          );
        }
      }

      uploadedFiles.push({
        fileName: sanitizeFilename(file.name),
        fileUrl: fileUrl,
        fileSize: file.size,
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files. Please try again.' },
      { status: 500 }
    );
  }
}
