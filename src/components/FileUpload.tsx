
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { FileUp, X, Check, AlertCircle } from 'lucide-react';

type FileUploadProps = {
  onFileUploadComplete?: (fileId: string, fileData: any) => void;
};

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploadComplete }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; status: 'uploading' | 'success' | 'error'; progress: number }>>([]);

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

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file content'));
        }
      };
      
      reader.onerror = () => reject(new Error('Error reading file'));
      
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // For PDF files, we'll read as text (this is a simplified approach)
        // In a real application, you'd use a PDF parsing library
        reader.readAsText(file);
      } else {
        // For other file types, try to read as text
        reader.readAsText(file);
      }
    });
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
        // Read file content
        const content = await readFileContent(file);
        
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
              title: "File Uploaded Successfully",
              description: `${file.name} has been uploaded and is ready for AI review.`,
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
          title: "Upload Failed",
          description: `There was an error processing ${file.name}.`,
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
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center ${dragActive ? 'border-legal-primary bg-legal-primary/5' : 'border-gray-300'}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <FileUp className="mx-auto h-12 w-12 text-legal-primary/70 mb-4" />
        <h3 className="font-serif text-lg font-semibold mb-2 text-legal-primary">Upload Legal Documents</h3>
        <p className="text-legal-accent mb-4">Drag and drop your files here, or click to browse</p>
        <p className="text-xs text-gray-500 mb-6">Supported formats: PDF, JPG, PNG, TXT</p>
        
        <label htmlFor="file-upload" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
          Browse Files
          <input 
            id="file-upload" 
            type="file" 
            className="hidden" 
            multiple 
            onChange={handleChange}
            accept=".pdf,.jpg,.jpeg,.png,.txt" 
          />
        </label>
      </div>
      
      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="font-medium text-sm text-gray-700">
            {uploading ? 'Processing Files' : 'Processed Files'}
          </h4>
          {uploadedFiles.map((file, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-3 flex items-center">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium truncate">{file.name}</span>
                    <button 
                      onClick={() => removeFile(index)} 
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {file.status === 'uploading' && (
                    <Progress value={file.progress} className="h-2" data-status="uploading" />
                  )}
                  
                  {file.status === 'success' && (
                    <div className="flex items-center text-green-600 text-xs">
                      <Check className="h-3 w-3 mr-1" /> Ready for AI review
                    </div>
                  )}
                  
                  {file.status === 'error' && (
                    <div className="flex items-center text-red-600 text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" /> Processing failed
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
