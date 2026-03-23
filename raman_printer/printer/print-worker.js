const { print } = require('pdf-to-printer');
const fs = require('fs');
const path = require('path');
const os = require('os');

// REPLACE this URL with your actual Vercel project URL once deployed
const VERCEL_APP_URL = 'https://raman-printer.vercel.app'; 

// Optionally add a secure secret so not just anyone can trigger prints 
const API_SECRET = 'your-secure-secret-here'; 

async function startPrintWorker() {
  console.log('🖨️  Local Print Worker Started...');
  console.log(`📡 Connecting to Vercel App: ${VERCEL_APP_URL}`);

  setInterval(async () => {
    try {
      // 1. Fetch orders that need to be printed
      const response = await fetch(`${VERCEL_APP_URL}/api/admin/pending-prints`);
      if (!response.ok) return;

      const data = await response.json();
      const orders = data.orders || [];

      for (const order of orders) {
        console.log(`\n📄 Found Order ${order._id} for printing...`);
        
        const isBW = order.serviceItems.some(item => 
          item.name.toLowerCase().includes('black') || item.name.toLowerCase().includes('b/w')
        );

        let success = true;

        for (const file of order.files) {
          try {
            console.log(`   Downloading ${file.fileName}...`);
            // 2. Download file to PC temp folder
            const pdfRes = await fetch(file.fileUrl);
            const buffer = await pdfRes.arrayBuffer();

            const tempPath = path.join(os.tmpdir(), `local_print_${order._id}_${Date.now()}.pdf`);
            fs.writeFileSync(tempPath, Buffer.from(buffer));

            const sumatraPdfPath = path.join(__dirname, 'node_modules', 'pdf-to-printer', 'dist', 'SumatraPDF-3.4.6-32.exe');

            // 3. Print the file locally
            console.log(`   Sending to printer...`);
            const printOptions = {
              printer: 'HP Ink Tank 310 series', // Or fetch from settings
              copies: order.copies || 1,
              scale: "fit",
              side: order.printSide === 'DOUBLE' ? 'duplexshort' : 'simplex',
              monochrome: isBW,
              sumatraPdfPath: sumatraPdfPath
            };

            await print(tempPath, printOptions);
            fs.unlinkSync(tempPath);
            console.log(`   ✅ Printed successfully!`);
          } catch (err) {
            console.error(`   ❌ Failed to print file:`, err.message);
            success = false;
          }
        }

        // 4. Update the order status back on Vercel
        if (success) {
          await fetch(`${VERCEL_APP_URL}/api/admin/mark-printed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: order._id })
          });
          console.log(`✅ Marked Order ${order._id} as READY on Vercel`);
        }
      }
    } catch (error) {
       // Silent error to prevent console spam if Vercel server sleeps
    }
  }, 10000); // Check every 10 seconds
}

startPrintWorker();
