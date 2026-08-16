import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

export async function downloadPdfFromElement(
  element: HTMLElement | null,
  filename: string,
  successMessage = 'পিডিএফ ডাউনলোড সফল হয়েছে'
): Promise<boolean> {
  if (!element) {
    toast.error('ডকুমেন্ট পাওয়া যায়নি');
    return false;
  }

  try {
    // Wait slightly to ensure all DOM renders are settled
    await new Promise((resolve) => setTimeout(resolve, 150));

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc, clonedElement) => {
        // 1. Remove all linked stylesheets (Netlify/Vite production CSS has oklch which breaks html2canvas)
        const links = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
        links.forEach((link) => link.remove());

        // 2. Remove all existing styles that might contain oklch
        const styles = clonedDoc.querySelectorAll('style');
        styles.forEach((style) => style.remove());

        // 3. Inject clean, comprehensive CSS reset and utility stylesheet without any oklch or CSS vars
        const safeStyle = clonedDoc.createElement('style');
        safeStyle.textContent = `
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #ffffff;
            color: #0f172a;
            -webkit-font-smoothing: antialiased;
          }
          .flex { display: flex; }
          .flex-col { flex-direction: column; }
          .flex-row { flex-direction: row; }
          .flex-wrap { flex-wrap: wrap; }
          .flex-grow { flex-grow: 1; }
          .shrink-0 { flex-shrink: 0; }
          .items-center { align-items: center; }
          .items-start { align-items: flex-start; }
          .items-end { align-items: flex-end; }
          .items-baseline { align-items: baseline; }
          .justify-between { justify-content: space-between; }
          .justify-center { justify-content: center; }
          .justify-end { justify-content: flex-end; }
          .justify-start { justify-content: flex-start; }
          .grid { display: grid; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .gap-1 { gap: 4px; }
          .gap-2 { gap: 8px; }
          .gap-3 { gap: 12px; }
          .gap-4 { gap: 16px; }
          .gap-6 { gap: 24px; }
          .gap-8 { gap: 32px; }
          .gap-12 { gap: 48px; }
          .gap-16 { gap: 64px; }
          .gap-20 { gap: 80px; }
          .gap-24 { gap: 96px; }
          .relative { position: relative; }
          .absolute { position: absolute; }
          .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
          .z-10 { z-index: 10; }
          .pointer-events-none { pointer-events: none; }
          .w-full { width: 100%; }
          .h-full { height: 100%; }
          .w-2 { width: 8px; }
          .h-2 { height: 8px; }
          .w-4 { width: 16px; }
          .h-4 { height: 16px; }
          .w-5 { width: 20px; }
          .h-5 { height: 20px; }
          .w-6 { width: 24px; }
          .h-6 { height: 24px; }
          .w-8 { width: 32px; }
          .h-8 { height: 32px; }
          .w-10 { width: 40px; }
          .h-10 { height: 40px; }
          .w-12 { width: 48px; }
          .h-12 { height: 48px; }
          .w-14 { width: 56px; }
          .h-14 { height: 56px; }
          .w-16 { width: 64px; }
          .h-16 { height: 64px; }
          .w-20 { width: 80px; }
          .h-20 { height: 80px; }
          .w-24 { width: 96px; }
          .h-24 { height: 96px; }
          .h-0\\.5, .h-0_5 { height: 2px; }
          .h-1 { height: 4px; }
          .max-w-\\[280px\\] { max-width: 280px; }
          .max-w-\\[300px\\] { max-width: 300px; }
          .max-w-\\[340px\\] { max-width: 340px; }
          .p-1 { padding: 4px; }
          .p-2 { padding: 8px; }
          .p-3 { padding: 12px; }
          .p-4 { padding: 16px; }
          .p-6 { padding: 24px; }
          .p-8 { padding: 32px; }
          .p-10 { padding: 40px; }
          .p-12 { padding: 48px; }
          .p-16 { padding: 64px; }
          .px-3 { padding-left: 12px; padding-right: 12px; }
          .py-1 { padding-top: 4px; padding-bottom: 4px; }
          .px-6 { padding-left: 24px; padding-right: 24px; }
          .px-8 { padding-left: 32px; padding-right: 32px; }
          .py-3 { padding-top: 12px; padding-bottom: 12px; }
          .py-4 { padding-top: 16px; padding-bottom: 16px; }
          .py-5 { padding-top: 20px; padding-bottom: 20px; }
          .py-6 { padding-top: 24px; padding-bottom: 24px; }
          .pt-4 { padding-top: 16px; }
          .pt-6 { padding-top: 24px; }
          .pt-12 { padding-top: 48px; }
          .pb-2 { padding-bottom: 8px; }
          .pl-2 { padding-left: 8px; }
          .m-0 { margin: 0; }
          .mb-1 { margin-bottom: 4px; }
          .mb-2 { margin-bottom: 8px; }
          .mb-4 { margin-bottom: 16px; }
          .mb-6 { margin-bottom: 24px; }
          .mb-8 { margin-bottom: 32px; }
          .mb-16 { margin-bottom: 64px; }
          .mb-20 { margin-bottom: 80px; }
          .mt-1 { margin-top: 4px; }
          .mt-2 { margin-top: 8px; }
          .mt-4 { margin-top: 16px; }
          .mt-6 { margin-top: 24px; }
          .mt-8 { margin-top: 32px; }
          .mt-12 { margin-top: 48px; }
          .mt-16 { margin-top: 64px; }
          .mt-20 { margin-top: 80px; }
          .ml-1 { margin-left: 4px; }
          .ml-auto { margin-left: auto; }
          .space-y-1 > * + * { margin-top: 4px; }
          .space-y-2 > * + * { margin-top: 8px; }
          .space-y-3 > * + * { margin-top: 12px; }
          .space-y-4 > * + * { margin-top: 16px; }
          .space-y-6 > * + * { margin-top: 24px; }
          .text-left { text-align: left; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-\\[9px\\] { font-size: 9px; }
          .text-\\[10px\\] { font-size: 10px; }
          .text-\\[11px\\] { font-size: 11px; }
          .text-xs { font-size: 12px; }
          .text-sm { font-size: 14px; }
          .text-base { font-size: 16px; }
          .text-lg { font-size: 18px; }
          .text-xl { font-size: 20px; }
          .text-2xl { font-size: 24px; }
          .text-3xl { font-size: 30px; }
          .text-4xl { font-size: 36px; }
          .text-6xl { font-size: 60px; }
          .font-normal { font-weight: 400; }
          .font-medium { font-weight: 500; }
          .font-semibold { font-weight: 600; }
          .font-bold { font-weight: 700; }
          .font-black { font-weight: 900; }
          .font-mono { font-family: monospace; }
          .italic { font-style: italic; }
          .uppercase { text-transform: uppercase; }
          .tracking-wider { letter-spacing: 0.05em; }
          .tracking-widest { letter-spacing: 0.1em; }
          .tracking-tighter { letter-spacing: -0.05em; }
          .leading-none { line-height: 1; }
          .leading-relaxed { line-height: 1.625; }
          .leading-loose { line-height: 2; }
          .rounded-full { border-radius: 9999px; }
          .rounded-lg { border-radius: 8px; }
          .rounded-xl { border-radius: 12px; }
          .rounded-2xl { border-radius: 16px; }
          .rounded-3xl { border-radius: 24px; }
          .overflow-hidden { overflow: hidden; }
          .border { border: 1px solid #e2e8f0; }
          .border-2 { border-width: 2px; }
          .border-collapse { border-collapse: collapse; }
          table { width: 100%; border-collapse: collapse; }
        `;
        clonedDoc.head.appendChild(safeStyle);

        // 4. Ensure target element is placed cleanly in the cloned document
        if (clonedElement) {
          clonedElement.style.position = 'static';
          clonedElement.style.left = '0';
          clonedElement.style.top = '0';
          clonedElement.style.display = 'block';
          clonedElement.style.margin = '0';
          clonedElement.style.visibility = 'visible';
        }

        const parent = clonedElement?.parentElement;
        if (parent) {
          parent.style.position = 'static';
          parent.style.left = '0';
          parent.style.top = '0';
          parent.style.display = 'block';
          parent.style.visibility = 'visible';
        }
      },
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const canvasWidthInPdf = pageWidth;
    const canvasHeightInPdf = (imgProps.height * canvasWidthInPdf) / imgProps.width;

    let heightLeft = canvasHeightInPdf;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, canvasWidthInPdf, canvasHeightInPdf);
    heightLeft -= pageHeight;

    // Add more pages if content extends beyond one A4 page
    while (heightLeft > 0) {
      position = heightLeft - canvasHeightInPdf;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, canvasWidthInPdf, canvasHeightInPdf);
      heightLeft -= pageHeight;
    }

    // Direct Blob URL download approach - highly reliable across desktop, mobile and hosting platforms
    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 4000);

    toast.success(successMessage);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);

    // Fallback: try window print for clean printing if canvas fails
    try {
      if (element) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${filename}</title>
                <style>
                  body { margin: 0; padding: 20px; font-family: sans-serif; background: #fff; }
                  @media print { body { padding: 0; } }
                </style>
              </head>
              <body>
                ${element.outerHTML}
                <script>
                  window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                  };
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
          toast.success('প্রিন্ট উইন্ডো খোলা হয়েছে');
          return true;
        }
      }
    } catch (fallbackError) {
      console.error('Fallback print error:', fallbackError);
    }

    toast.error('ডাউনলোড করতে সমস্যা হয়েছে, দয়া করে আবার চেষ্টা করুন।');
    return false;
  }
}
