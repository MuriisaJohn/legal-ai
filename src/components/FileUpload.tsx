
import React, { useState } from 'react';
import { toast } from "@/components/ui/use-toast";
import FileUploadZone from './FileUploadZone';
import UploadedFilesList, { UploadedFile } from './UploadedFilesList';
import { readFileContent } from '@/utils/fileReader';

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
