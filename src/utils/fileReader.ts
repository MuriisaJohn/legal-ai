
import { extractTextFromPDF } from './pdfExtractor';

export const readFileContent = async (file: File): Promise<string> => {
  try {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      console.log('Processing PDF file:', file.name);
      return await extractTextFromPDF(file);
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          if (typeof result === 'string') {
            resolve(result);
          } else {
            reject(new Error('Failed to read text file'));
          }
        };
        reader.onerror = () => reject(new Error('Error reading text file'));
        reader.readAsText(file);
      });
    } else {
      // For other file types, try to read as text
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
        reader.readAsText(file);
      });
    }
  } catch (error) {
    console.error('Error reading file content:', error);
    throw error;
  }
};
