import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Settings from '@/models/Settings';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { print } from 'pdf-to-printer';
import { ensurePdf } from '@/lib/fileConverter';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    
    // Check if Auto-Print is enabled
    const settings = await Settings.findOne();
    if (!settings || !settings.isAutoPrintEnabled) {
      return NextResponse.json({ success: true, printed: 0, status: 'disabled' });
    }

    // Find orders that are PENDING and older than configured delay (default 10 seconds)
    const delaySeconds = settings.autoPrintDelaySeconds !== undefined ? settings.autoPrintDelaySeconds : 10;
    const delayAgo = new Date(Date.now() - delaySeconds * 1000);
    const orders = await Order.find({
      status: 'PENDING',
      cancelRequested: false, // Don't print if user asked to cancel
      createdAt: { $lte: delayAgo }
    });

    if (orders.length === 0) {
      return NextResponse.json({ success: true, printed: 0 });
    }

    let printedCount = 0;
    const printerName = settings.autoPrinterName || 'HP Ink Tank 310 series';

    for (const order of orders) {
      // 1. Mark as PRINTING instantly so concurrent requests don't duplicate print jobs
      order.status = 'PRINTING';
      order.printedAt = new Date();
      await order.save();

      try {
        // Is it Black & White?
        const isBW = order.serviceItems.some((item: any) => 
          item.name.toLowerCase().includes('black') || item.name.toLowerCase().includes('b/w')
        );
        
        // Loop through all files in this order
        for (const file of order.files) {
          let targetPath = '';
          let needsCleanup = false;

          // If hosted on a remote server like Vercel Blob, we must download it to the Temp OS folder
          if (file.fileUrl.startsWith('http')) {
            const response = await fetch(file.fileUrl);
            if (!response.ok) throw new Error('Failed to fetch file from server');
            const buffer = await response.arrayBuffer();
            
            const originalExt = path.extname(file.fileName || '') || '.pdf';
            targetPath = path.join(os.tmpdir(), `print_${order._id}_${Date.now()}${originalExt}`);
            fs.writeFileSync(targetPath, Buffer.from(buffer));
            needsCleanup = true;
          } else {
            // It's a local file in /public/uploads/
            // Parse relative path to strict OS absolute path
            const relativePath = file.fileUrl.startsWith('/') ? file.fileUrl.substring(1) : file.fileUrl;
            targetPath = path.join(process.cwd(), 'public', relativePath);
            
            if (!fs.existsSync(targetPath)) {
              throw new Error(`Local file not found: ${targetPath}`);
            }
          }

          const pdfData = await ensurePdf(targetPath);
          const finalPrintPath = pdfData.path;

          const sumatraPdfPath = path.join(process.cwd(), 'node_modules', 'pdf-to-printer', 'dist', 'SumatraPDF-3.4.6-32.exe');

          // Prepare Print Options
          const printOptions: any = {
            printer: printerName,
            copies: order.copies || 1,
            scale: "fit",
            sumatraPdfPath: sumatraPdfPath
          };

          // Sumatra PDF configuration flags
          const advancedSettings = [];
          
          if (order.printSide === 'DOUBLE') {
            advancedSettings.push('duplexshort');
          } else {
            advancedSettings.push('simplex');
          }

          if (isBW) {
            advancedSettings.push('monochrome');
          } else {
            advancedSettings.push('color');
          }

          // Merge advanced settings directly via standard params
          if (advancedSettings.length > 0) {
             printOptions.side = order.printSide === 'DOUBLE' ? 'duplexshort' : 'simplex';
             printOptions.monochrome = isBW;
          }

          // Execute print command
          await print(finalPrintPath, printOptions);

          // Clean up temp file ONLY if it was downloaded OR converted
          if (pdfData.isTemp) {
            if (fs.existsSync(finalPrintPath)) fs.unlinkSync(finalPrintPath);
          }
          if (needsCleanup) {
            if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
          }
        }
        
        // Mark as Ready
        order.status = 'READY';
        await order.save();
        printedCount++;
      } catch (e: any) {
        console.error('Print job failed for Order', order._id, ':', e);
        // Revert to PENDING so it can be retried or manually handled
        order.status = 'PENDING';
        await order.save();
      }
    }

    return NextResponse.json({ success: true, printed: printedCount });
  } catch (error) {
    console.error('Auto-Print Daemon Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to run print worker' }, { status: 500 });
  }
}
