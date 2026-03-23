import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Settings from '@/models/Settings';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { print } from 'pdf-to-printer';
import { ensurePdf } from '@/lib/fileConverter';

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    await connectDB();
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const settings = await Settings.findOne();
    const printerName = settings?.autoPrinterName || 'HP Ink Tank 310 series';

    order.status = 'PRINTING';
    order.printedAt = new Date();
    await order.save();

    try {
      const isBW = order.serviceItems.some((item: any) => 
        item.name.toLowerCase().includes('black') || item.name.toLowerCase().includes('b/w')
      );
      
      for (const file of order.files) {
        let targetPath = '';
        let needsCleanup = false;

        // If hosted on a remote server like Vercel Blob, we must download it to the Temp OS folder
        if (file.fileUrl.startsWith('http')) {
          const response = await fetch(file.fileUrl);
          if (!response.ok) throw new Error('Failed to fetch file from server');
          const buffer = await response.arrayBuffer();
          
          const originalExt = path.extname(file.fileName || '') || '.pdf';
          targetPath = path.join(os.tmpdir(), `manual_print_${order._id}_${Date.now()}${originalExt}`);
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

        const printOptions: any = {
          printer: printerName,
          copies: order.copies || 1,
          scale: "fit",
          side: order.printSide === 'DOUBLE' ? 'duplexlong' : 'simplex',
          monochrome: isBW,
          sumatraPdfPath: sumatraPdfPath
        };

        await print(finalPrintPath, printOptions);
        
        if (pdfData.isTemp) {
          if (fs.existsSync(finalPrintPath)) fs.unlinkSync(finalPrintPath);
        }
        if (needsCleanup) {
          if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
        }
      }
      
      order.status = 'READY';
      await order.save();
      
      return NextResponse.json({ success: true, message: 'Print job sent successfully' });
    } catch (e: any) {
      console.error('Manual print failed:', e);
      order.status = 'PENDING';
      await order.save();
      return NextResponse.json({ success: false, error: e.message || 'Failed to send to printer. Check connection.', stack: e.stack }, { status: 500 });
    }
  } catch (error) {
    console.error('Print Now Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
