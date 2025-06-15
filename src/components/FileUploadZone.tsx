
import React from 'react';
import { FileUp } from 'lucide-react';

type FileUploadZoneProps = {
  dragActive: boolean;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  dragActive,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onChange
}) => {
  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-8 text-center ${dragActive ? 'border-legal-primary bg-legal-primary/5' : 'border-gray-300'}`}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
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
          onChange={onChange}
          accept=".pdf,.jpg,.jpeg,.png,.txt" 
        />
      </label>
    </div>
  );
};

export default FileUploadZone;
