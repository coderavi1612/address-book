# Implementation Plan: Address Book PDF Layout Builder

## Overview

This implementation plan breaks down the Address Book PDF Layout Builder into discrete coding tasks. The application is a Next.js 16 web application with TypeScript, Supabase backend, Zustand state management, and react-pdf for PDF generation. Tasks are organized to build incrementally, with testing integrated throughout.

## Tasks

- [x] 1. Project setup and dependencies
  - Install required npm packages: @supabase/ssr, @supabase/supabase-js, zustand, zod, react-hook-form, @hookform/resolvers, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, @react-pdf/renderer, sonner (toast notifications), fast-check (dev dependency), @testing-library/react (dev dependency)
  - Configure environment variables for Supabase (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
  - Set up shadcn/ui components (button, input, textarea, dialog, toast)
  - _Requirements: All_

- [x] 2. Database schema and Supabase configuration
  - [x] 2.1 Create Supabase migration for address_blocks table
    - Define table with columns: id (uuid), names (text[]), address (text), mobile (text), x (integer), y (integer), width (integer), height (integer), page_number (integer), created_at (timestamptz), updated_at (timestamptz), user_id (uuid)
    - Add constraints: names_not_empty, positive_dimensions, positive_position, positive_page
    - Create indexes on user_id and page_number
    - Create updated_at trigger function
    - _Requirements: 18.1, 18.3, 18.4, 18.5_
  
  - [x] 2.2 Create Supabase client utilities
    - Create lib/supabase/server.ts with createClient function using createServerClient
    - Create lib/supabase/client.ts with createClient function using createBrowserClient
    - _Requirements: 1.1, 1.2_

- [x] 3. Type definitions and Zod schemas
  - [x] 3.1 Create TypeScript interfaces
    - Define AddressBlock interface in types/block.ts
    - Define GridConfig interface in types/block.ts
    - Define BlockStore interface in types/block.ts
    - _Requirements: 2.1_
  
  - [x] 3.2 Create Zod validation schemas
    - Define nameSchema, addressBlockSchema, createBlockSchema, updateBlockSchema in schemas/block.ts
    - Add validation rules: names min 1, address max 500 chars, mobile regex pattern, name max 100 chars
    - Export CreateBlockInput and UpdateBlockInput types
    - _Requirements: 15.2, 15.3, 15.4, 15.5_
  
  - [x] 3.3 Write property test for Zod validation
    - **Property 3: Names Array Validation**
    - **Validates: Requirements 2.5, 15.2**
    - Test that empty names array fails validation
  
  - [x] 3.4 Write property test for mobile number validation
    - **Property 22: Mobile Number Format Validation**
    - **Validates: Requirements 15.3**
    - Test that invalid mobile formats fail validation
  
  - [x] 3.5 Write property test for address length validation
    - **Property 23: Address Length Validation**
    - **Validates: Requirements 15.4**
    - Test that addresses over 500 characters fail validation
  
  - [x] 3.6 Write property test for name length validation
    - **Property 24: Name Length Validation**
    - **Validates: Requirements 15.5**
    - Test that names over 100 characters fail validation

- [x] 4. Grid configuration utilities
  - Create lib/gridConfig.ts with calculateGridConfig function
  - Calculate A4 dimensions, margins, and grid unit sizes for 3×3 default layout
  - _Requirements: 17.1, 17.2_

- [x] 5. Zustand state management store
  - [x] 5.1 Implement BlockStore with Zustand
    - Create store/blockStore.ts with state: blocks, selectedBlockId, currentPage, zoomLevel, history, historyIndex
    - Implement actions: setBlocks, addBlock, updateBlock, deleteBlock, selectBlock, setCurrentPage, setZoomLevel, undo, redo, pushHistory
    - Add MAX_HISTORY constant (50)
    - _Requirements: 10.1, 10.2, 12.1_
  
  - [x] 5.2 Write unit tests for BlockStore actions
    - Test addBlock, updateBlock, deleteBlock, selectBlock actions
    - Test history management (pushHistory, undo, redo)
    - _Requirements: 10.2, 12.1_

- [x] 6. Server actions for CRUD operations
  - [x] 6.1 Implement getBlocks server action
    - Create app/actions/blocks.ts with getBlocks function
    - Fetch blocks filtered by authenticated user_id
    - Order by page_number, y, x
    - _Requirements: 1.3, 18.2_
  
  - [x] 6.2 Implement createBlock server action
    - Add createBlock function with Zod validation
    - Insert block with user_id from authenticated session
    - Call revalidatePath('/editor')
    - _Requirements: 7.1, 7.2, 7.5_
  
  - [x] 6.3 Implement updateBlock server action
    - Add updateBlock function with user_id filtering
    - Update block and revalidate path
    - _Requirements: 2.6, 11.1_
  
  - [x] 6.4 Implement deleteBlock server action
    - Add deleteBlock function with user_id filtering
    - Delete block and revalidate path
    - _Requirements: 3.6_
  
  - [x] 6.5 Implement duplicateBlock server action
    - Add duplicateBlock function that fetches original block
    - Create duplicate with offset position (x+1, y+1)
    - _Requirements: 7.3, 7.4_
  
  - [x] 6.6 Write property test for user data isolation
    - **Property 1: User Data Isolation**
    - **Validates: Requirements 1.3, 18.2**
    - Test that queries only return blocks for authenticated user
  
  - [x] 6.7 Write unit tests for server actions
    - Test createBlock, updateBlock, deleteBlock with mocked Supabase client
    - Test error handling and authentication checks
    - _Requirements: 1.3, 2.6, 3.6, 7.5_

- [x] 7. Error handling utilities
  - Create lib/errorHandling.ts with AppError class, withRetry function, handleError function
  - Implement retry logic with exponential backoff (max 3 retries)
  - _Requirements: 11.4, 19.1, 19.2, 19.3, 19.4_

- [x] 8. Checkpoint - Core infrastructure complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. BlockEditor component
  - [x] 9.1 Create BlockEditor component
    - Create components/BlockEditor.tsx with React Hook Form integration
    - Add dynamic name array inputs with Add/Remove buttons
    - Add address textarea and mobile input fields
    - Add Save, Delete, and Duplicate buttons
    - Integrate Zod validation with inline error messages
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 15.6_
  
  - [x] 9.2 Implement autosave hook
    - Create hooks/useAutosave.ts with debounced save logic (500ms delay)
    - Integrate with BlockEditor to auto-save on form changes
    - _Requirements: 11.1, 11.2, 11.3_
  
  - [x] 9.3 Write property test for names array modification
    - **Property 2: Names Array Modification**
    - **Validates: Requirements 2.3, 2.4**
    - Test that adding/removing names correctly modifies array
  
  - [x] 9.4 Write unit tests for BlockEditor
    - Test form rendering, validation errors, save/delete actions
    - Test name array add/remove functionality
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 10. AddressBlock component
  - [x] 10.1 Create AddressBlock component
    - Create components/AddressBlock.tsx with memo optimization
    - Display names, address, mobile with print-friendly styling
    - Add selection highlighting (blue border when selected, grey otherwise)
    - Position using absolute positioning with x, y, width, height props
    - _Requirements: 4.3, 16.1, 16.5_
  
  - [x] 10.2 Write unit tests for AddressBlock
    - Test rendering with different block data
    - Test selection highlighting
    - Test memo optimization with custom comparison
    - _Requirements: 4.3, 16.1, 16.5_

- [x] 11. Drag-and-drop functionality
  - [x] 11.1 Implement useDragAndDrop hook
    - Create hooks/useDragAndDrop.ts using dnd-kit's useDndMonitor
    - Calculate new position in grid units on drag end
    - Calculate page number based on Y position
    - Perform optimistic update to store
    - Call updateBlock server action to persist
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [x] 11.2 Integrate dnd-kit with AddressBlock
    - Wrap AddressBlock with useDraggable from dnd-kit
    - Add DndContext to LayoutCanvas
    - _Requirements: 5.1, 5.2_
  
  - [x] 11.3 Write property test for drag position update
    - **Property 6: Drag Position Update**
    - **Validates: Requirements 5.2, 5.4**
    - Test that dragging updates x, y, page_number in store and database
  
  - [x] 11.4 Write property test for snap-to-grid alignment
    - **Property 7: Snap-to-Grid Alignment**
    - **Validates: Requirements 5.3, 6.3, 17.3, 17.4**
    - Test that positions and dimensions are multiples of grid unit
  
  - [x] 11.5 Write property test for cross-page dragging
    - **Property 8: Cross-Page Dragging**
    - **Validates: Requirements 5.5**
    - Test that dragging to different page updates page_number
  
  - [x] 11.6 Write unit tests for useDragAndDrop
    - Test drag end handler with various delta values
    - Test page calculation logic
    - _Requirements: 5.2, 5.4, 5.5_

- [x] 12. Resize functionality
  - [x] 12.1 Implement useResize hook
    - Create hooks/useResize.ts with resize handlers
    - Calculate new dimensions in grid units
    - Enforce minimum dimensions (1 grid unit)
    - Perform optimistic update and persist to database
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 12.2 Add resize handles to AddressBlock
    - Add corner resize handles with appropriate cursors
    - Integrate useResize hook
    - _Requirements: 6.1_
  
  - [x] 12.3 Write property test for block resize update
    - **Property 9: Block Resize Update**
    - **Validates: Requirements 6.2, 6.4**
    - Test that resizing updates width and height in store and database
  
  - [x] 12.4 Write property test for minimum dimensions constraint
    - **Property 10: Minimum Dimensions Constraint**
    - **Validates: Requirements 6.5**
    - Test that width and height are always at least 1 grid unit
  
  - [x] 12.5 Write unit tests for useResize
    - Test resize calculations with various deltas
    - Test minimum dimension enforcement
    - _Requirements: 6.2, 6.4, 6.5_

- [x] 13. LayoutCanvas component
  - [x] 13.1 Create LayoutCanvas component
    - Create components/LayoutCanvas.tsx with DndContext
    - Render multi-page vertical scroll layout
    - Display page separators and page numbers
    - Add grid overlay (toggleable)
    - Implement click-to-select functionality
    - Add zoom controls
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [x] 13.2 Implement click selection and deselection
    - Handle click on AddressBlock to select
    - Handle click on empty space to deselect
    - Update selectedBlockId in store
    - _Requirements: 4.7, 16.1, 16.2, 16.4_
  
  - [x] 13.3 Write property test for block selection synchronization
    - **Property 4: Block Selection Synchronization**
    - **Validates: Requirements 3.2, 4.7, 16.1, 16.2, 16.3**
    - Test that selection updates store, highlights block, and populates editor
  
  - [x] 13.4 Write property test for deselection on empty click
    - **Property 26: Deselection on Empty Click**
    - **Validates: Requirements 16.4**
    - Test that clicking empty space clears selectedBlockId
  
  - [x] 13.5 Write unit tests for LayoutCanvas
    - Test rendering of blocks across multiple pages
    - Test click selection and deselection
    - Test zoom controls
    - _Requirements: 4.1, 4.2, 4.5, 4.6, 4.7_

- [x] 14. PageNavigator component
  - [x] 14.1 Create PageNavigator component
    - Create components/PageNavigator.tsx with page thumbnails
    - Display page numbers and Add Page button
    - Implement click-to-scroll functionality
    - _Requirements: 8.2, 8.3, 8.4, 8.6_
  
  - [x] 14.2 Write unit tests for PageNavigator
    - Test page thumbnail rendering
    - Test click-to-scroll behavior
    - Test Add Page button
    - _Requirements: 8.2, 8.3, 8.4_

- [x] 15. EditorLayout component
  - Create components/EditorLayout.tsx with split-screen layout
  - Implement resizable panels (40% editor, 60% canvas)
  - Add responsive behavior for tablet and mobile
  - _Requirements: 4.1_

- [x] 16. Checkpoint - UI components complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Keyboard shortcuts
  - [x] 17.1 Implement useKeyboardShortcuts hook
    - Create hooks/useKeyboardShortcuts.ts
    - Handle Delete key for block deletion
    - Handle Ctrl+D for block duplication
    - Handle Ctrl+Z for undo
    - Handle Ctrl+Y for redo
    - Handle Escape for deselection
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  
  - [x] 17.2 Write property test for delete keyboard shortcut
    - **Property 18: Delete Keyboard Shortcut**
    - **Validates: Requirements 13.1**
    - Test that Delete key removes selected block
  
  - [x] 17.3 Write property test for duplicate keyboard shortcut
    - **Property 19: Duplicate Keyboard Shortcut**
    - **Validates: Requirements 13.2**
    - Test that Ctrl+D duplicates selected block
  
  - [x] 17.4 Write property test for deselect keyboard shortcut
    - **Property 20: Deselect Keyboard Shortcut**
    - **Validates: Requirements 13.5**
    - Test that Escape clears selectedBlockId
  
  - [x] 17.5 Write unit tests for useKeyboardShortcuts
    - Test all keyboard shortcuts with simulated key events
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 18. Undo/redo functionality
  - [x] 18.1 Integrate undo/redo with BlockStore
    - Ensure pushHistory is called before state mutations
    - Implement undo and redo actions in store
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.6_
  
  - [x] 18.2 Create Toolbar component with undo/redo buttons
    - Create components/Toolbar.tsx with Undo, Redo, Add Block, Export PDF buttons
    - Disable buttons when history is empty
    - _Requirements: 12.2_
  
  - [x] 18.3 Write property test for undo state restoration
    - **Property 16: Undo State Restoration**
    - **Validates: Requirements 12.3**
    - Test that undo restores previous state
  
  - [x] 18.4 Write property test for redo state restoration
    - **Property 17: Redo State Restoration**
    - **Validates: Requirements 12.4**
    - Test that redo restores next state
  
  - [x] 18.5 Write unit tests for undo/redo
    - Test history management with multiple state changes
    - Test undo/redo with history limits
    - _Requirements: 12.1, 12.3, 12.4, 12.6_

- [x] 19. PDF generation
  - [x] 19.1 Create PDFDocument component
    - Create components/PDFDocument.tsx using @react-pdf/renderer
    - Define A4 page dimensions and print margins
    - Group blocks by page_number
    - Render blocks with absolute positioning matching canvas
    - Apply print-friendly styling (white bg, grey borders, dark text)
    - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [x] 19.2 Implement useExportPDF hook
    - Create hooks/useExportPDF.ts
    - Generate PDF blob using pdf() from @react-pdf/renderer
    - Trigger browser download
    - Handle errors with user-friendly messages
    - _Requirements: 9.1, 9.2, 9.7_
  
  - [x] 19.3 Write property test for PDF block positioning
    - **Property 14: PDF Block Positioning**
    - **Validates: Requirements 9.5**
    - Test that PDF positions match block properties
  
  - [x] 19.4 Write property test for canvas-PDF styling consistency
    - **Property 21: Canvas-PDF Styling Consistency**
    - **Validates: Requirements 14.4**
    - Test that canvas and PDF styling match
  
  - [x] 19.5 Write unit tests for PDF generation
    - Test PDFDocument rendering with various block configurations
    - Test multi-page PDF generation
    - Test error handling in useExportPDF
    - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 20. Authentication integration
  - [x] 20.1 Create authentication pages
    - Create app/login/page.tsx with email/password form
    - Create app/signup/page.tsx with registration form
    - Add Supabase Auth integration
    - _Requirements: 1.1, 1.2_
  
  - [x] 20.2 Create middleware for protected routes
    - Create middleware.ts to check authentication
    - Redirect unauthenticated users to login
    - _Requirements: 1.3_
  
  - [x] 20.3 Implement logout functionality
    - Add logout button to UI
    - Call Supabase signOut and redirect to login
    - _Requirements: 1.4_
  
  - [x] 20.4 Write unit tests for authentication
    - Test login/signup forms 
    - Test middleware redirect logic
    - Test logout functionality
    - _Requirements: 1.1, 1.2, 1.4_

- [x] 21. Main editor page
  - [x] 21.1 Create editor page with RSC data loading
    - Create app/editor/page.tsx as React Server Component
    - Fetch blocks using getBlocks server action
    - Pass blocks to EditorLayout as initialBlocks prop
    - _Requirements: 10.5_
  
  - [x] 21.2 Hydrate BlockStore on client
    - Call setBlocks in useEffect to populate store from initialBlocks
    - _Requirements: 10.5_
  
  - [x] 21.3 Write integration test for editor page
    - Test full flow: load blocks, select, edit, save
    - _Requirements: 10.5_

- [x] 22. Checkpoint - Core functionality complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 23. Additional property tests for completeness
  - [x] 23.1 Write property test for block deletion completeness
    - **Property 5: Block Deletion Completeness**
    - **Validates: Requirements 3.6**
    - Test that deletion removes from store, database, and clears selection
  
  - [x] 23.2 Write property test for block duplication preservation
    - **Property 11: Block Duplication Preservation**
    - **Validates: Requirements 7.4**
    - Test that duplicate has same data but different ID and position
  
  - [x] 23.3 Write property test for new block persistence
    - **Property 12: New Block Persistence**
    - **Validates: Requirements 7.5**
    - Test that new blocks exist in database immediately
  
  - [x] 23.4 Write property test for automatic page creation
    - **Property 13: Automatic Page Creation**
    - **Validates: Requirements 8.5**
    - Test that dragging beyond last page creates new page
  
  - [x] 23.5 Write property test for state persistence synchronization
    - **Property 15: State Persistence Synchronization**
    - **Validates: Requirements 10.4**
    - Test that all modifications persist to database
  
  - [x] 23.6 Write property test for invalid data save prevention
    - **Property 25: Invalid Data Save Prevention**
    - **Validates: Requirements 15.7**
    - Test that validation errors prevent database persistence

- [ ] 24. Performance optimizations
  - [x] 24.1 Implement virtualization for large layouts
    - Create hooks/useVirtualization.ts to filter visible blocks
    - Integrate with LayoutCanvas to render only visible pages
    - _Requirements: 20.3_
  
  - [x] 24.2 Add React.memo to expensive components
    - Optimize AddressBlock with custom comparison function
    - Optimize other components as needed
    - _Requirements: 20.4_
  
  - [x] 24.3 Write performance tests
    - Test rendering performance with 100+ blocks
    - Test PDF generation time with large layouts
    - _Requirements: 20.1, 20.5_

- [ ] 25. UI polish and accessibility
  - [x] 25.1 Add loading states and error messages
    - Display loading spinners during data fetching
    - Show toast notifications for save success/failure
    - Add error dialogs for PDF generation failures
    - _Requirements: 14.5, 14.6, 19.1, 19.2, 19.3, 19.4_
  
  - [x] 25.2 Implement autosave indicator
    - Display "Saving..." and "Saved" status in UI
    - Add fade-out animation for "Saved" message
    - _Requirements: 11.3_
  
  - [x] 25.3 Add ARIA labels and keyboard navigation
    - Add aria-label to all interactive elements
    - Ensure logical tab order
    - Add visible focus indicators
    - _Requirements: 14.1, 14.2, 14.3_
  
  - [x] 25.4 Write accessibility tests
    - Test keyboard navigation
    - Test ARIA labels with screen reader simulation
    - Test color contrast
    - _Requirements: 14.1, 14.2, 14.3_

- [ ] 26. Final integration and testing
  - [x] 26.1 Run full test suite
    - Execute all unit tests and property tests
    - Verify 80% code coverage minimum
    - Ensure all 26 properties pass with 100 iterations
    - _Requirements: All_
  
  - [x] 26.2 Write end-to-end test for complete workflow
    - Test: Login → Create blocks → Arrange layout → Export PDF
    - _Requirements: All_
  
  - [x] 26.3 Manual testing and bug fixes
    - Test on different browsers (Chrome, Firefox, Safari)
    - Test responsive behavior on tablet and mobile
    - Fix any discovered bugs
    - _Requirements: All_

- [ ] 27. Final checkpoint - Implementation complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with 100 iterations
- Unit tests validate specific examples, edge cases, and integration points
- Checkpoints ensure incremental validation at key milestones
- All code should be written in TypeScript with full type safety
- Use Next.js 16 App Router patterns with React Server Components where appropriate
- Follow the design document's architecture and component structure
