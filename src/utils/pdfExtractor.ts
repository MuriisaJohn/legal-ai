
import * as pdfjsLib from 'pdfjs-dist';

// The worker is now copied to the build output directory by `vite-plugin-static-copy`.
// We can reference it directly by its path.
pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;
console.log('PDF.js worker configured with static path:', pdfjsLib.GlobalWorkerOptions.workerSrc);

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    console.log('=== PDF EXTRACTION START ===');
    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    const arrayBuffer = await file.arrayBuffer();
    console.log('ArrayBuffer created successfully, size:', arrayBuffer.byteLength);
    
    console.log('Attempting to load PDF document...');
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useSystemFonts: true,
      isEvalSupported: false,
    });
    
    loadingTask.onProgress = (progress) => {
      console.log('PDF loading progress:', Math.round((progress.loaded / progress.total) * 100) + '%');
    };
    
    const pdf = await loadingTask.promise;
    console.log('PDF loaded successfully! Pages:', pdf.numPages);
    
    let fullText = '';
    
    // Extract text from each page with detailed logging
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        console.log(`Processing page ${pageNum}/${pdf.numPages}...`);
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => (typeof item.str === 'string' ? item.str : ''))
          .filter(text => text.trim().length > 0)
          .join(' ');
          
        fullText += pageText + '\n';
        
      } catch (pageError) {
        console.error(`Error processing page ${pageNum}:`, pageError);
        // Continue with other pages even if one fails
      }
    }
    
    console.log('=== PDF EXTRACTION COMPLETE ===');
    console.log('Total extracted text length:', fullText.length);
    
    if (fullText.trim().length === 0) {
      throw new Error('No text content could be extracted from the PDF. The document might be image-based or corrupted.');
    }
    
    return fullText.trim();
    
  } catch (error) {
    console.error('=== PDF EXTRACTION ERROR ===');
    console.error('Full error object:', error);
    
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    
    if (message.includes('worker')) {
      throw new Error('PDF processing failed due to a worker script error. Please try again.');
    }
    
    throw new Error(`Failed to extract text from PDF: ${message}`);
  }
};
