
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
    
    // Add new files to our state
    const newFiles = Array.from(files).map(file => ({
      name: file.name,
      status: 'uploading' as const,
      progress: 0
    }));
    
    setUploadedFiles([...uploadedFiles, ...newFiles]);
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileIndex = uploadedFiles.length + i;
      
      try {
        console.log(`Processing file: ${file.name}, Type: ${file.type}`);
        
        // Read file content
        const content = await readFileContent(file);
        
        console.log(`Extracted content length: ${content.length} characters`);
        console.log(`Content preview: ${content.substring(0, 200)}...`);
        
        // Simulate upload progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += 20;
          setUploadedFiles(prev => 
            prev.map((f, idx) => 
              idx === fileIndex ? { ...f, progress } : f
            )
          );
          
          if (progress >= 100) {
            clearInterval(interval);
            
            setUploadedFiles(prev => 
              prev.map((f, idx) => 
                idx === fileIndex ? { ...f, status: 'success' } : f
              )
            );
            
            toast({
              title: "File Processed Successfully",
              description: `${file.name} has been processed and is ready for AI analysis.`,
              variant: "default",
            });
            
            // Pass file content to the callback
            if (onFileUploadComplete) {
              onFileUploadComplete(`file-${Date.now()}-${i}`, {
                name: file.name,
                size: file.size,
                type: file.type,
                content: content
              });
            }
          }
        }, 150);
        
      } catch (error) {
        console.error('Error processing file:', error);
        
        setUploadedFiles(prev => 
          prev.map((f, idx) => 
            idx === fileIndex ? { ...f, status: 'error' } : f
          )
        );
        
        toast({
          title: "Processing Failed",
          description: `There was an error processing ${file.name}. ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      }
    }
    
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
