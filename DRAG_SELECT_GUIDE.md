# Drag-to-Select Feature Guide

## Overview
The drag-to-select feature allows you to select multiple address blocks by simply dragging a selection rectangle across the canvas.

## How to Use

### 1. Draw Selection Rectangle
- **Click and drag** on empty canvas space (not on blocks)
- A blue selection rectangle will appear showing your selection area
- **Blocks are highlighted in real-time** as you drag - any block within the rectangle will show a blue border
- Drag to encompass the blocks you want to select

### 2. Release to Select
- **Release the mouse button** to complete the selection
- All blocks within or intersecting the selection rectangle will be selected
- Selected blocks will have a blue border and ring

### 3. Delete Selected Blocks
- Once multiple blocks are selected, a **"Delete (X)"** button appears in the toolbar
- Click this button to delete all selected blocks at once

## Additional Selection Methods

### Ctrl/Cmd + Click (Toggle Selection)
- Hold **Ctrl** (Windows/Linux) or **Cmd** (Mac)
- Click individual blocks to add/remove them from selection
- Works alongside drag-select

### Normal Click (Single Selection)
- Click a block without any modifier keys to select only that block
- Clears any previous multi-selection

### Drag Block to Move
- Click and drag the **drag handle** (top bar of a block) to move it
- This is separate from drag-select - dragging the handle moves the block, dragging empty space selects blocks

## Visual Indicators

### Selection Rectangle
- **Blue border with semi-transparent fill**: Shows the area being selected
- **Fixed positioning**: Follows your mouse as you drag
- **Minimum size**: Must drag at least 5 pixels to trigger selection
- **15% transparent**: You can see blocks underneath while dragging

### Selected Blocks
- **Blue border (2px)**: Indicates block is selected
- **Blue ring**: Additional visual emphasis
- **Shadow**: Enhanced shadow for better visibility
- **Real-time preview**: Blocks highlight as you drag the selection rectangle (before you release the mouse)

## Technical Details

### Implementation
- **Custom Sensor**: `ConditionalPointerSensor` only activates drag-and-drop when clicking on block drag handles
- **Viewport Coordinates**: Selection rectangle uses fixed positioning for smooth rendering
- **Coordinate Conversion**: Converts viewport coordinates to container coordinates for block intersection
- **Intersection Detection**: Uses bounding box intersection algorithm
- **Real-time Preview**: Calculates which blocks are in selection box on every mouse move for live highlighting
- **Text Selection Disabled**: `userSelect: 'none'` prevents text selection interference

### Console Logging
The feature includes debug logging to help troubleshoot issues:
- `[DragSelect] Mouse down`
- `[DragSelect] Starting selection at X, Y`
- `[DragSelect] Mouse move to X, Y`
- `[DragSelect] Mouse up, ending selection`
- `[DragSelect] Selection box: {left, top, width, height}`
- `[DragSelect] Selected blocks: [id1, id2, ...]`
- `[LayoutCanvas] Selection changed: [id1, id2, ...]`
- `[LayoutCanvas] Selection box visible: {left, top, width, height}`
- `[LayoutCanvas] Preview selected blocks: [id1, id2, ...]` (shows real-time preview)

### Files Modified
1. **hooks/useDragSelect.ts**: Core drag-select logic with Shift key detection
2. **hooks/useConditionalPointerSensor.ts**: Custom sensor that disables drag-and-drop when Shift is held
3. **components/LayoutCanvas.tsx**: Integration of drag-select with canvas, cursor changes, and selection rectangle rendering
4. **components/AddressBlock.tsx**: Prevents block selection when Shift is held
5. **components/Toolbar.tsx**: Added helpful tip about Shift+Drag
6. **store/blockStore.ts**: Multi-select state management (already implemented)

## Troubleshooting

### Selection Rectangle Not Visible
1. Open browser console (F12)
2. Try to drag on empty canvas space
3. Check for console logs starting with `[DragSelect]`
4. If you see "Clicked on block, ignoring", you're clicking on a block instead of empty canvas
5. Make sure you're dragging on the gray canvas area, not on the white page or blocks

### Blocks Not Being Selected
1. Check console for `[DragSelect] Selected blocks:` log
2. Verify the selection box coordinates are correct
3. Ensure you're dragging at least 5 pixels (minimum threshold)
4. Check that blocks are within the selection rectangle

### Drag-and-Drop Not Working
1. Make sure you're clicking and dragging the **drag handle** (top bar of the block)
2. The drag handle has a gray background with horizontal lines icon
3. Dragging anywhere else on the canvas will trigger drag-select instead

## Testing

Run the test suite to verify functionality:
```bash
npm test -- useDragSelect.test.ts
```

Tests cover:
- Selection start/stop
- Block click prevention
- Selection box calculation
- Coordinate conversion
- Real-time preview

## Future Enhancements

Potential improvements:
- Add visual feedback when hovering over blocks in selection mode
- Support for Ctrl+A to select all blocks
- Support for Escape key to clear selection
- Add selection count indicator in toolbar
- Support for inverting selection
- Add keyboard shortcuts for selection operations
