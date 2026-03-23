import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { PDFDocument } from 'pdf-lib';

const execAsync = promisify(exec);

export async function convertDocxToPdf(inputPath: string, outputPath: string) {
  // Use PowerShell COM object to convert Word doc to PDF natively on Windows
  // This bypasses the need for 3rd party modules but requires MS Word to be installed on the machine.
  
  const scriptContent = `
$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $doc = $word.Documents.Open('${inputPath}')
    $doc.SaveAs([ref] '${outputPath}', [ref] 17)
    $doc.Close()
} catch {
    Write-Error $_.Exception.Message
    exit 1
} finally {
    $word.Quit()
}
`;

  // Create a temporary ps1 script file
  const scriptPath = path.join(os.tmpdir(), `convert_${Date.now()}.ps1`);
  fs.writeFileSync(scriptPath, scriptContent);

  try {
    await execAsync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`);
  } catch (err: any) {
    throw new Error('Failed to convert word document to PDF. Ensure Microsoft Word is installed on the host machine. Error: ' + err.message);
  } finally {
    if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);
  }
}

export async function convertImageToPdf(inputPath: string, outputPath: string) {
  const imageBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.create();
  
  let image;
  if (inputPath.toLowerCase().endsWith('.png')) {
    image = await pdfDoc.embedPng(imageBytes);
  } else if (inputPath.toLowerCase().match(/\.(jpg|jpeg)$/)) {
    image = await pdfDoc.embedJpg(imageBytes);
  } else {
    throw new Error('Unsupported image format. Only PNG, JPG, and JPEG are supported.');
  }

  // Preserve arbitrary aspect ratios securely
  const page = pdfDoc.addPage([image.width, image.height]);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
}

export async function ensurePdf(inputPath: string): Promise<{ path: string, isTemp: boolean }> {
  // If the file extension indicates it's already a PDF, or if the file comes from Vercel without an extension and we assume it's PDF
  const ext = path.extname(inputPath).toLowerCase();
  
  if (ext === '.pdf') {
    return { path: inputPath, isTemp: false };
  }

  const outputPath = `${inputPath}_converted.pdf`;

  if (ext === '.docx' || ext === '.doc') {
    await convertDocxToPdf(inputPath, outputPath);
    return { path: outputPath, isTemp: true };
  }

  if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
    await convertImageToPdf(inputPath, outputPath);
    return { path: outputPath, isTemp: true };
  }

  // Fallback: If no extension, try checking headers elsewhere or just risk printing it directly
  if (!ext) {
     return { path: inputPath, isTemp: false };
  }

  throw new Error(`Unsupported file type for automated printing: ${ext}. Only PDF, DOCX, DOC, JPG, and PNG are supported.`);
}
