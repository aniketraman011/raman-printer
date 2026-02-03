import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
const pdfParse = require('pdf-parse');

// Configure route for large file uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for file upload

export async function POST(request: NextRequest) {
  try {
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

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const extension = file.name.split('.').pop();
      const uniqueFilename = `${timestamp}-${randomString}.${extension}`;

      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload to Vercel Blob storage
      let blob;
      try {
        blob = await put(uniqueFilename, buffer, {
          access: 'public',
          contentType: file.type,
        });
      } catch (uploadError: any) {
        console.error('Blob upload error:', uploadError);
        return NextResponse.json(
          { error: `Failed to upload file: ${file.name}. ${uploadError.message}` },
          { status: 500 }
        );
      }

      // Detect PDF page count
      let pageCount;
      if (file.type === 'application/pdf') {
        try {
          const pdfData = await pdfParse(buffer);
          pageCount = pdfData.numpages;
        } catch (error) {
          console.error('PDF parsing error:', error);
          // If PDF parsing fails, pageCount will be undefined
        }
      }

      uploadedFiles.push({
        fileName: file.name,
        fileUrl: blob.url, // Use Vercel Blob URL
        fileSize: file.size,
        pageCount, // Will be undefined for non-PDF files or if parsing fails
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload files. Please try again.' },
      { status: 500 }
    );
  }
}
