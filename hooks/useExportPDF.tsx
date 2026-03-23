import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { useBlockStore } from '@/store/blockStore';
import { PDFDocument } from '@/components/PDFDocument';
import { calculateGridConfig } from '@/lib/gridConfig';
import { toast } from 'sonner';

export function useExportPDF() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blocks = useBlockStore((state) => state.blocks);
  const pageOrientation = useBlockStore((state) => state.pageOrientation);
  
  const exportPDF = async () => {
    setIsExporting(true);
    setError(null);
    
    try {
      const gridConfig = calculateGridConfig(pageOrientation);
      
      // Generate PDF blob
      const blob = await pdf(
        <PDFDocument 
          blocks={blocks} 
          gridConfig={gridConfig} 
          orientation={pageOrientation}
        />
      ).toBlob();
      
      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `address-book-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('PDF export failed:', error);
      
      // User-friendly error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred';
      
      setError(errorMessage);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };
  
  const clearError = () => setError(null);
  
  return { exportPDF, isExporting, error, clearError };
}
