// This file will contain both the FileUpload component and the file reading utility.
// In a real application, it's often better to separate concerns into different files
// for better organization, reusability, and maintainability.

import React, { useState, useEffect } from 'react';
import { toast } from "@/shared/components/ui/use-toast";
import FileUploadZone from './FileUploadZone';
import UploadedFilesList, { UploadedFile } from './UploadedFilesList';
import * as mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
import * as PDFJS from 'pdfjs-dist';

// Initialize PDF.js
const initializePdfJs = async () => {
  if (!PDFJS.GlobalWorkerOptions.workerSrc) {
    PDFJS.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;
  }
  return PDFJS;
};

const readFileContent = async (
  file: File,
  onProgress: (progress: number) => void
): Promise<string> => {
  // Ensure PDF.js is initialized
  await initializePdfJs();
  
  return new Promise(async (resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 50; // Initial 50% for reading file
        onProgress(progress);
      }
    };

    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      let extractedText = '';

      try {
        if (file.type === 'application/pdf') {          onProgress(50); // Mark file read complete, start PDF processing
          await initializePdfJs();
          const pdf = await PDFJS.getDocument({ data: arrayBuffer }).promise;
          let pdfText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            pdfText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
            onProgress(50 + (i / pdf.numPages) * 50); // Progress for PDF pages
          }
          extractedText = pdfText;
        } else if (
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
          onProgress(50); // Mark file read complete, start DOCX processing
          const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
          extractedText = result.value;
          onProgress(100);
        } else if (file.type.startsWith('image/')) {
          onProgress(50); // Mark file read complete, start OCR processing
          // For image OCR, Tesseract.js is a good client-side option.
          // You'll need to handle the worker and language data setup for Tesseract.js
          const blob = new Blob([arrayBuffer]);
          const imageUrl = URL.createObjectURL(blob);
          const { data: { text } } = await Tesseract.recognize(
            imageUrl,
            'eng', // You can specify other languages here
            {
              logger: m => {
                if (m.status === 'recognizing text') {
                  onProgress(50 + m.progress * 50); // Progress for OCR
                }
              }
            }
          );
          URL.revokeObjectURL(imageUrl); // Clean up the URL after use
          extractedText = text;
        } else if (file.type.startsWith('text/')) {
          const decoder = new TextDecoder('utf-8');
          extractedText = decoder.decode(arrayBuffer);
          onProgress(100);
        } else {
          reject(new Error(`Unsupported file type: ${file.type}`));
          return;
        }
        resolve(extractedText);
      } catch (error) {
        console.error('Error in readFileContent:', error);
        reject(new Error(`Failed to extract content from ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    // Start reading the file as an ArrayBuffer
    // This is important for binary formats like PDF, DOCX, and images
    reader.readAsArrayBuffer(file);
  });
};
// --- End of readFileContent Utility ---

// Export readFileContent after PDF.js initialization
export { readFileContent };

type FileUploadProps = {
  onFileUploadComplete?: (fileId: string, fileData: any) => void;
};

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploadComplete }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    setUploading(true);

    const newFiles = Array.from(files).map(file => ({
      name: file.name,
      status: 'uploading' as const,
      progress: 0
    }));

    const startIndex = uploadedFiles.length;
    setUploadedFiles(prev => [...prev, ...newFiles]);

    const processingPromises = Array.from(files).map(async (file, index) => {
      const fileIndex = startIndex + index;

      const onProgress = (progress: number) => {
        setUploadedFiles(prev =>
          prev.map((f, idx) =>
            idx === fileIndex ? { ...f, progress: Math.floor(progress) } : f
          )
        );
      };

      try {
        console.log(`Processing file: ${file.name}, Type: ${file.type}`);
        onProgress(5); // Initial small progress

        const content = await readFileContent(file, onProgress);

        console.log(`Extracted content length: ${content.length} characters`);

        onProgress(100);
        setUploadedFiles(prev =>
          prev.map((f, idx) =>
            idx === fileIndex ? { ...f, status: 'success' } : f
          )
        );

        toast({
          title: "File Processed Successfully",
          description: `${file.name} is ready for AI analysis.`,
          variant: "default",
        });

        if (onFileUploadComplete) {
          onFileUploadComplete(`file-${Date.now()}-${index}`, {
            name: file.name,
            size: file.size,
            type: file.type,
            content: content
          });
        }
      } catch (error) {
        console.error('Error processing file:', error);

        setUploadedFiles(prev =>
          prev.map((f, idx) =>
            idx === fileIndex ? { ...f, status: 'error', progress: 0 } : f
          )
        );

        toast({
          title: "Processing Failed",
          description: `There was an error processing ${file.name}. ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      }
    });

    await Promise.all(processingPromises);

    setUploading(false);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full">
      <FileUploadZone
        dragActive={dragActive}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onChange={handleChange}
      />

      <UploadedFilesList
        files={uploadedFiles}
        uploading={uploading}
        onRemoveFile={removeFile}
      />
    </div>
  );
};

export default FileUpload;