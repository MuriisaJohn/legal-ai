
import React from 'react';
import { Card, CardContent } from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { X, Check, AlertCircle } from 'lucide-react';

export type UploadedFile = {
  name: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
};

type UploadedFilesListProps = {
  files: UploadedFile[];
  uploading: boolean;
  onRemoveFile: (index: number) => void;
};

const UploadedFilesList: React.FC<UploadedFilesListProps> = ({
  files,
  uploading,
  onRemoveFile
}) => {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-3">
      <h4 className="font-medium text-sm text-gray-700">
        {uploading ? 'Processing Files' : 'Processed Files'}
      </h4>
      {files.map((file, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-3 flex items-center">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium truncate">{file.name}</span>
                <button 
                  onClick={() => onRemoveFile(index)} 
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
                  <Check className="h-3 w-3 mr-1" /> Ready for AI analysis
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
  );
};

export default UploadedFilesList;
