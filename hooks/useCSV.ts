import { useCallback, useRef } from 'react';
import { AddressBlock } from '@/types/block';
import { createBlock } from '@/app/actions/blocks';
import { useBlockStore } from '@/store/blockStore';
import { toast } from 'sonner';

// CSV columns: names (semicolon-separated), address, mobile
// Example: "John Doe;Jane Doe","123 Main St","555-1234"

function parseCSV(text: string): Array<{ names: string[]; address: string; mobile: string }> {
  const lines = text.trim().split('\n').filter(Boolean);
  // Skip header row if present
  const dataLines = lines[0]?.toLowerCase().includes('name') ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    // Handle quoted fields with commas inside
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());

    const namesRaw = fields[0] ?? '';
    const address = fields[1] ?? '';
    const mobile = fields[2] ?? '';
    const names = namesRaw.split(';').map(n => n.trim()).filter(Boolean);

    return { names: names.length > 0 ? names : [''], address, mobile };
  });
}

function blocksToCSV(blocks: AddressBlock[]): string {
  const header = 'id,names,address,mobile';
  const rows = blocks.map((b, index) => {
    const id = index + 1;
    const names = `"${b.names.join(';')}"`;
    const address = `"${b.address.replace(/"/g, '""')}"`;
    const mobile = `"${b.mobile.replace(/"/g, '""')}"`;
    return `${id},${names},${address},${mobile}`;
  });
  return [header, ...rows].join('\n');
}

export function useCSV() {
  const addBlock = useBlockStore(s => s.addBlock);
  const blocks = useBlockStore(s => s.blocks);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importCSV = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so same file can be re-imported
    e.target.value = '';

    const text = await file.text();
    let rows: ReturnType<typeof parseCSV>;
    try {
      rows = parseCSV(text);
    } catch {
      toast.error('Failed to parse CSV file');
      return;
    }

    if (rows.length === 0) {
      toast.error('No data found in CSV');
      return;
    }

    // Find next available position after existing blocks
    const COLS = 3;
    const ROWS = 3;
    const existingBlocks = useBlockStore.getState().blocks;

    let page = existingBlocks.length > 0 ? Math.max(...existingBlocks.map(b => b.page_number)) : 1;
    let col = 0;
    let row = 0;

    // Build occupancy for last page
    const occupied = new Set(
      existingBlocks
        .filter(b => b.page_number === page)
        .map(b => `${b.x},${b.y}`)
    );

    const nextSlot = () => {
      while (occupied.has(`${col},${row}`)) {
        col++;
        if (col >= COLS) { col = 0; row++; }
        if (row >= ROWS) { col = 0; row = 0; page++; occupied.clear(); }
      }
      occupied.add(`${col},${row}`);
      const result = { x: col, y: row, page_number: page };
      col++;
      if (col >= COLS) { col = 0; row++; }
      if (row >= ROWS) { col = 0; row = 0; page++; occupied.clear(); }
      return result;
    };

    let successCount = 0;
    for (const row_ of rows) {
      try {
        const slot = nextSlot();
        const newBlock = await createBlock({
          names: row_.names,
          address: row_.address,
          mobile: row_.mobile,
          x: slot.x,
          y: slot.y,
          width: 1,
          height: 1,
          page_number: slot.page_number,
        });
        addBlock(newBlock);
        successCount++;
      } catch {
        // continue importing remaining rows
      }
    }

    toast.success(`Imported ${successCount} of ${rows.length} contacts`);
  }, [addBlock]);

  const exportCSV = useCallback(() => {
    if (blocks.length === 0) {
      toast.error('No blocks to export');
      return;
    }
    const csv = blocksToCSV(blocks);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'address-book.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  }, [blocks]);

  const downloadSample = useCallback(() => {
    const sample = [
      'names,address,mobile',
      '"John Doe","123 Main St, Springfield, IL 62701","555-123-4567"',
      '"Jane Smith;Bob Smith","456 Oak Ave, Chicago, IL 60601","555-987-6543"',
      '"Alice Johnson","789 Pine Rd, Apt 2B, New York, NY 10001","555-246-8101"',
      '"Carlos Rivera","321 Elm St, Austin, TX 73301","555-369-1214"',
    ].join('\n');
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-address-book.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return { importCSV, exportCSV, downloadSample, handleFileChange, fileInputRef };
}
