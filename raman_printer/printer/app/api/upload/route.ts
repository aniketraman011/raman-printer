import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
const pdfParse = require('pdf-parse');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
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
    const uploadDir = join(process.cwd(), 'public', 'uploads');

    // Ensure upload directory exists
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
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

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const extension = file.name.split('.').pop();
      const uniqueFilename = `${timestamp}-${randomString}.${extension}`;

      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filePath = join(uploadDir, uniqueFilename);

      await writeFile(filePath, buffer);

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
        fileUrl: `/uploads/${uniqueFilename}`,
        fileSize: file.size,
        pageCount, // Will be undefined for non-PDF files or if parsing fails
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}
