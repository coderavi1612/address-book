'use client';

import { useEffect, memo, useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addressBlockSchema, CreateBlockInput } from '@/schemas/block';
import { useBlockStore } from '@/store/blockStore';
import { deleteBlock, duplicateBlock } from '@/app/actions/blocks';
import { useAutosave } from '@/hooks/useAutosave';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2, Copy, Loader2 } from 'lucide-react';

interface BlockEditorProps {
  selectedBlockId: string | null;
}

export const BlockEditor = memo(function BlockEditor({ selectedBlockId }: BlockEditorProps) {
  const blocks = useBlockStore((state) => state.blocks);
  const deleteBlockFromStore = useBlockStore((state) => state.deleteBlock);
  const addBlockToStore = useBlockStore((state) => state.addBlock);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
  
  const {
    register,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateBlockInput>({
    resolver: zodResolver(addressBlockSchema),
    defaultValues: {
      names: [''],
      address: '',
      mobile: '',
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      page_number: 1,
    },
  });
  
  // Watch form changes for autosave
  const formData = watch();
  
  // Create a synthetic block for autosave — only updates when form values change
  const autosaveBlock = selectedBlock ? {
    ...selectedBlock,
    names: formData.names ?? selectedBlock.names,
    address: formData.address ?? selectedBlock.address,
    mobile: formData.mobile ?? selectedBlock.mobile,
  } : null;
  
  // Autosave: fires 2s after user stops typing (Google Docs style)
  const { status: autosaveStatus } = useAutosave(autosaveBlock, 2000);
  
  const { fields, append, remove } = useFieldArray({ control, name: 'names' as never });

  // Track the current block ID to detect block changes
  const currentBlockIdRef = useRef<string | null>(null);

  // Reset form when selected block changes (switching blocks)
  useEffect(() => {    if (currentBlockIdRef.current === (selectedBlock?.id ?? null)) return;
    currentBlockIdRef.current = selectedBlock?.id ?? null;

    if (selectedBlock) {
      reset({
        names: selectedBlock.names,
        address: selectedBlock.address,
        mobile: selectedBlock.mobile,
        x: selectedBlock.x,
        y: selectedBlock.y,
        width: selectedBlock.width,
        height: selectedBlock.height,
        page_number: selectedBlock.page_number,
      });
    } else {
      reset({ names: [''], address: '', mobile: '', x: 0, y: 0, width: 1, height: 1, page_number: 1 });
    }
  }, [selectedBlock?.id, reset]);
  
  const handleDelete = async () => {
    if (!selectedBlockId) {
      toast.error('No block selected');
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteBlock(selectedBlockId);
      deleteBlockFromStore(selectedBlockId);
      toast.success('Block deleted successfully');
    } catch (error) {
      console.error('Failed to delete block:', error);
      toast.error('Failed to delete block');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleDuplicate = async () => {
    if (!selectedBlockId) {
      toast.error('No block selected');
      return;
    }
    
    setIsDuplicating(true);
    try {
      const newBlock = await duplicateBlock(selectedBlockId);
      addBlockToStore(newBlock);
      toast.success('Block duplicated successfully');
    } catch (error) {
      console.error('Failed to duplicate block:', error);
      toast.error('Failed to duplicate block');
    } finally {
      setIsDuplicating(false);
    }
  };
  
  if (!selectedBlock) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="max-w-sm space-y-4">
          <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Block Selected
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Click on a block in the canvas to edit it, or create a new one to get started.
            </p>
          </div>
          <div className="pt-2">
            <p className="text-xs text-gray-500">
              💡 Tip: You can drag blocks to rearrange them and resize using the corner handle.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Edit Contact</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Changes are saved automatically
            </p>
          </div>
          <div className="flex items-center gap-2">
            {autosaveStatus === 'saving' && (
              <span className="text-xs text-gray-600 flex items-center gap-1.5" role="status" aria-live="polite">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}
            {autosaveStatus === 'saved' && (
              <span className="text-xs text-green-600 flex items-center gap-1.5 animate-fade-out" role="status" aria-live="polite">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Form Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <form className="p-6 space-y-6" aria-label="Edit address block form">
          {/* Names Array */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Names
              <span className="text-xs text-gray-500 font-normal">(at least one required)</span>
            </label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  {...register(`names.${index}`)}
                  placeholder="Enter name"
                  className={errors.names?.[index] ? 'border-red-500' : ''}
                  aria-label={`Name ${index + 1}`}
                  aria-invalid={!!errors.names?.[index]}
                  aria-describedby={errors.names?.[index] ? `name-error-${index}` : undefined}
                />
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => remove(index)}
                    aria-label={`Remove name ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {errors.names && (
              <p className="text-sm text-red-500" role="alert">{errors.names.message}</p>
            )}
            {fields.map((field, index) => (
              errors.names?.[index] && (
                <p key={field.id} id={`name-error-${index}`} className="text-sm text-red-500" role="alert">
                  {errors.names[index]?.message}
                </p>
              )
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append('')}
              className="w-full"
              aria-label="Add another name"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Name
            </Button>
          </div>
          
          {/* Address */}
          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Address
            </label>
            <Textarea
              id="address"
              {...register('address')}
              placeholder="Enter full address"
              rows={4}
              className={errors.address ? 'border-red-500' : ''}
              aria-invalid={!!errors.address}
              aria-describedby={errors.address ? 'address-error' : undefined}
            />
            {errors.address && (
              <p id="address-error" className="text-sm text-red-500" role="alert">{errors.address.message}</p>
            )}
          </div>
          
          {/* Mobile */}
          <div className="space-y-2">
            <label htmlFor="mobile" className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Mobile
            </label>
            <Input
              id="mobile"
              {...register('mobile')}
              placeholder="Enter mobile number"
              className={errors.mobile ? 'border-red-500' : ''}
              aria-invalid={!!errors.mobile}
              aria-describedby={errors.mobile ? 'mobile-error' : undefined}
            />
            {errors.mobile && (
              <p id="mobile-error" className="text-sm text-red-500" role="alert">{errors.mobile.message}</p>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3 pt-4" role="group" aria-label="Block actions">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleDuplicate}
                disabled={isDuplicating}
                aria-label="Duplicate this address block"
                className="flex-1"
              >
                {isDuplicating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Duplicate
              </Button>
              {/* <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                disabled={isDeleting}
                aria-label="Delete this address block"
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </Button> */}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});
