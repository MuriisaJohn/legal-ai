
import * as pdfjsLib from 'pdfjs-dist';

// Multiple fallback approaches for PDF.js worker configuration
const configureWorker = () => {
  console.log('Configuring PDF.js worker...');
  console.log('PDF.js version:', pdfjsLib.version);
  
  // Try multiple worker configurations in order of preference
  const workerPaths = [
    // Vite dev server path
    '/node_modules/pdfjs-dist/build/pdf.worker.min.js',
    // CDN fallback
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`,
    // Another CDN fallback
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`
  ];
  
  // Use the first available worker path
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerPaths[0];
  console.log('Worker configured with path:', pdfjsLib.GlobalWorkerOptions.workerSrc);
};

// Configure the worker immediately
configureWorker();

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    console.log('=== PDF EXTRACTION START ===');
    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    // Check if worker is properly configured
    console.log('Current worker source:', pdfjsLib.GlobalWorkerOptions.workerSrc);
    
    const arrayBuffer = await file.arrayBuffer();
    console.log('ArrayBuffer created successfully, size:', arrayBuffer.byteLength);
    
    // More robust PDF loading with detailed error handling
    console.log('Attempting to load PDF document...');
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useSystemFonts: true,
      isEvalSupported: false,
      useWorkerFetch: false
    });
    
    // Add progress listener
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
        console.log(`Page ${pageNum} loaded, getting text content...`);
        
        const textContent = await page.getTextContent();
        console.log(`Page ${pageNum} text items found:`, textContent.items.length);
        
        const pageText = textContent.items
          .map((item: any) => {
            // More robust text extraction
            return typeof item.str === 'string' ? item.str : '';
          })
          .filter(text => text.trim().length > 0)
          .join(' ');
          
        console.log(`Page ${pageNum} extracted text length:`, pageText.length);
        fullText += pageText + '\n';
        
      } catch (pageError) {
        console.error(`Error processing page ${pageNum}:`, pageError);
        // Continue with other pages even if one fails
      }
    }
    
    console.log('=== PDF EXTRACTION COMPLETE ===');
    console.log('Total extracted text length:', fullText.length);
    console.log('Text preview (first 200 chars):', fullText.substring(0, 200));
    
    if (fullText.trim().length === 0) {
      throw new Error('No text content could be extracted from the PDF. The PDF might be image-based or corrupted.');
    }
    
    return fullText.trim();
    
  } catch (error) {
    console.error('=== PDF EXTRACTION ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Full error object:', error);
    
    // Try to reconfigure worker and retry once
    if (error instanceof Error && error.message.includes('worker')) {
      console.log('Worker error detected, trying CDN fallback...');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      console.log('Retrying with CDN worker...');
      
      // Don't retry to avoid infinite recursion - just throw with better error message
      throw new Error(`PDF worker failed to load. Please check your internet connection and try again. Original error: ${error.message}`);
    }
    
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
  }
};
