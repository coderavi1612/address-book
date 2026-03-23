'use client';

import { Plus, FileDown, LogOut, Loader2, Trash2, Upload, Download, FileSpreadsheet, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { memo } from 'react';
import { useCSV } from '@/hooks/useCSV';

interface ToolbarProps {
  onAddBlock?: () => void;
  onExportPDF?: () => void;
  onDeleteSelected?: () => void;
  onOpenSearch?: () => void;
  isAddingBlock?: boolean;
  isExporting?: boolean;
  selectedCount?: number;
}

export const Toolbar = memo(function Toolbar({ 
  onAddBlock, 
  onExportPDF,
  onDeleteSelected,
  onOpenSearch,
  isAddingBlock = false,
  isExporting = false,
  selectedCount = 0,
}: ToolbarProps) {
  const router = useRouter();
  const { importCSV, exportCSV, downloadSample, handleFileChange, fileInputRef } = useCSV();

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3 border-b bg-white shadow-sm">
      <div className="flex items-center gap-3">
        {/* Hidden file input for CSV import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
          aria-label="Import CSV file"
        />

        <Button
          variant="default"
          size="sm"
          onClick={onAddBlock}
          disabled={isAddingBlock}
          title="Add Block"
          aria-label="Add new address block"
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isAddingBlock ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Add Block
        </Button>

        {selectedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDeleteSelected}
            title={`Delete ${selectedCount} selected block${selectedCount > 1 ? 's' : ''}`}
            aria-label={`Delete ${selectedCount} selected block${selectedCount > 1 ? 's' : ''}`}
            className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete ({selectedCount})
          </Button>
        )}

        <div className="h-6 w-px bg-gray-200" role="separator" aria-orientation="vertical" />

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenSearch}
          title="Search (Ctrl+F)"
          aria-label="Search contacts"
        >
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={importCSV}
          title="Import CSV"
          aria-label="Import contacts from CSV file"
        >
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={exportCSV}
          title="Export CSV"
          aria-label="Export contacts as CSV file"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={downloadSample}
          title="Download sample CSV"
          aria-label="Download sample CSV file"
          className="text-gray-500 hover:text-gray-700"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Sample CSV
        </Button>

        <div className="h-6 w-px bg-gray-200" role="separator" aria-orientation="vertical" />

        <Button
          variant="outline"
          size="sm"
          onClick={onExportPDF}
          disabled={isExporting}
          title="Export PDF"
          aria-label="Export address book as PDF"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4 mr-2" />
          )}
          Export PDF
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        title="Logout"
        aria-label="Logout from application"
        className="text-gray-600 hover:text-gray-900"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </div>
  );
});
