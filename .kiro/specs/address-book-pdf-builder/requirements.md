# Requirements Document

## Introduction

The Address Book PDF Layout Builder is a web application that enables users to create, edit, and export printable multi-page address book PDFs with a customizable grid-based layout. Users can manage address blocks containing multiple names, addresses, and mobile numbers, arrange them using drag-and-drop functionality, and generate print-ready PDF documents with a clean white theme optimized for physical printing.

## Glossary

- **System**: The Address Book PDF Layout Builder web application
- **User**: An authenticated person using the application to create address book PDFs
- **Address_Block**: A single unit containing names array, address, and mobile number with position and size properties
- **Layout_Canvas**: The visual preview area displaying the grid-based arrangement of Address_Blocks
- **Grid_Unit**: A single cell in the 3×3 default grid layout per page
- **Block_Editor**: The form interface for editing Address_Block data
- **PDF_Export_Engine**: The component responsible for generating printable PDF files
- **Supabase_Backend**: The backend service providing authentication, database, and storage
- **Block_Store**: The Zustand state management store for Address_Blocks and UI state
- **Page**: A single sheet in the multi-page layout, defaulting to 3×3 grid (9 blocks)

## Requirements

### Requirement 1: User Authentication

**User Story:** As a User, I want to securely log in with my email, so that my address book layouts are private and persistent across sessions.

#### Acceptance Criteria

1. THE System SHALL provide email-based authentication using Supabase_Backend
2. WHEN a User successfully authenticates, THE System SHALL create a persistent session
3. THE System SHALL restrict access to Address_Blocks based on the authenticated User's user_id
4. WHEN a User logs out, THE System SHALL terminate the session and redirect to the login page

### Requirement 2: Address Block Data Management

**User Story:** As a User, I want to store address blocks with multiple names, so that I can create entries for households or groups sharing the same address.

#### Acceptance Criteria

1. THE System SHALL store Address_Blocks in Supabase_Backend with fields: id, names (text array), address, mobile, x, y, width, height, page_number, created_at, updated_at, user_id
2. THE System SHALL support dynamic array input for the names field with minimum 1 name entry
3. WHEN a User adds a name, THE System SHALL append a new name input field to the names array
4. WHEN a User removes a name, THE System SHALL delete that entry from the names array
5. THE System SHALL validate that at least one name exists before saving an Address_Block
6. THE System SHALL persist all Address_Block changes to Supabase_Backend within 500ms of user action

### Requirement 3: Block Editor Interface

**User Story:** As a User, I want to edit address block details in a form, so that I can input and modify contact information easily.

#### Acceptance Criteria

1. THE System SHALL display a Block_Editor on the left side of the split-screen interface
2. WHEN a User selects an Address_Block, THE Block_Editor SHALL populate with that block's data
3. THE Block_Editor SHALL provide input fields for names array, address textarea, and mobile number
4. THE Block_Editor SHALL provide Add Name, Delete Name, Save Block, and Delete Block buttons
5. WHEN a User clicks Save Block, THE System SHALL validate the data using Zod schema and persist to Supabase_Backend
6. WHEN a User clicks Delete Block, THE System SHALL remove the Address_Block from Supabase_Backend and Block_Store
7. THE System SHALL use React Hook Form for form state management and validation

### Requirement 4: Layout Canvas Preview

**User Story:** As a User, I want to see a live preview of my address book layout, so that I can visualize how the printed PDF will look.

#### Acceptance Criteria

1. THE System SHALL display a Layout_Canvas on the right side of the split-screen interface
2. THE Layout_Canvas SHALL render Address_Blocks in a grid layout with default 3 columns × 3 rows per Page
3. THE Layout_Canvas SHALL use white background, dark grey text, and light grey borders for print-friendly styling
4. WHEN a User modifies an Address_Block, THE Layout_Canvas SHALL update in real-time within 100ms
5. THE Layout_Canvas SHALL support multi-page vertical scrolling with visible page separators
6. THE Layout_Canvas SHALL provide zoom controls for adjusting preview scale
7. WHEN a User clicks an Address_Block on the Layout_Canvas, THE System SHALL highlight it and sync selection with Block_Editor

### Requirement 5: Drag-and-Drop Layout Editing

**User Story:** As a User, I want to drag and drop address blocks to rearrange them, so that I can customize the layout to my preferences.

#### Acceptance Criteria

1. THE System SHALL implement drag-and-drop functionality using dnd-kit library
2. WHEN a User drags an Address_Block, THE System SHALL allow repositioning within the Layout_Canvas
3. THE System SHALL provide snap-to-grid alignment during drag operations
4. WHEN a User drops an Address_Block, THE System SHALL update x, y, and page_number properties in Supabase_Backend
5. THE System SHALL support dragging Address_Blocks between different Pages
6. THE System SHALL provide visual feedback during drag operations with cursor changes and block highlighting

### Requirement 6: Block Resizing

**User Story:** As a User, I want to resize address blocks, so that I can allocate more or less space based on content length.

#### Acceptance Criteria

1. THE System SHALL provide corner resize handles on each Address_Block in the Layout_Canvas
2. WHEN a User drags a resize handle, THE System SHALL adjust the width and height properties
3. THE System SHALL constrain resizing to Grid_Unit increments for alignment
4. WHEN a User completes resizing, THE System SHALL persist the new width and height to Supabase_Backend
5. THE System SHALL maintain minimum dimensions of 1 Grid_Unit width and 1 Grid_Unit height

### Requirement 7: Block Creation and Duplication

**User Story:** As a User, I want to add new blocks and duplicate existing ones, so that I can quickly build my address book layout.

#### Acceptance Criteria

1. THE System SHALL provide an Add Block button that creates a new Address_Block with default values
2. WHEN a User clicks Add Block, THE System SHALL create an Address_Block with width=1, height=1, and position at the next available Grid_Unit
3. THE System SHALL provide a Duplicate Block button for the selected Address_Block
4. WHEN a User clicks Duplicate Block, THE System SHALL create a copy with identical data but new position
5. THE System SHALL persist new and duplicated Address_Blocks to Supabase_Backend immediately

### Requirement 8: Multi-Page Management

**User Story:** As a User, I want to work with multiple pages, so that I can create address books with more than 9 entries.

#### Acceptance Criteria

1. THE System SHALL support unlimited Pages in a single layout
2. THE System SHALL provide an Add Page button that creates a new empty Page
3. THE System SHALL provide a Page navigator sidebar showing all Pages with thumbnails
4. WHEN a User clicks a Page in the navigator, THE Layout_Canvas SHALL scroll to that Page
5. THE System SHALL automatically create a new Page when an Address_Block is dragged beyond the last Page boundary
6. THE System SHALL display page numbers on each Page in the Layout_Canvas

### Requirement 9: PDF Export

**User Story:** As a User, I want to export my layout as a PDF, so that I can print physical address book pages.

#### Acceptance Criteria

1. THE System SHALL provide an Export PDF button in the interface
2. WHEN a User clicks Export PDF, THE PDF_Export_Engine SHALL generate a multi-page PDF document
3. THE PDF_Export_Engine SHALL render each Page with A4 dimensions and print-ready margins
4. THE PDF_Export_Engine SHALL match the Layout_Canvas styling exactly (white background, light grey borders, dark grey text)
5. THE PDF_Export_Engine SHALL position Address_Blocks according to their x, y, width, height, and page_number properties
6. THE PDF_Export_Engine SHALL use react-pdf or pdf-lib library for PDF generation
7. WHEN PDF generation completes, THE System SHALL trigger a browser download of the PDF file

### Requirement 10: State Management

**User Story:** As a User, I want my changes to be reflected immediately across the interface, so that I have a seamless editing experience.

#### Acceptance Criteria

1. THE System SHALL use Zustand for Block_Store state management
2. THE Block_Store SHALL maintain selectedBlockId, blocks array, currentPage, and zoomLevel
3. WHEN an Address_Block is modified, THE System SHALL update Block_Store and trigger re-renders within 100ms
4. THE System SHALL sync Block_Store with Supabase_Backend using Next.js server actions
5. WHEN the application loads, THE System SHALL populate Block_Store from Supabase_Backend for the authenticated User

### Requirement 11: Autosave and Data Persistence

**User Story:** As a User, I want my changes to be saved automatically, so that I don't lose work if I close the browser.

#### Acceptance Criteria

1. WHEN a User modifies an Address_Block, THE System SHALL automatically save changes to Supabase_Backend within 500ms
2. THE System SHALL debounce rapid changes to prevent excessive database writes
3. THE System SHALL display a visual indicator (e.g., "Saving..." or "Saved") during autosave operations
4. IF a save operation fails, THE System SHALL display an error message and retry up to 3 times

### Requirement 12: Undo and Redo Support

**User Story:** As a User, I want to undo and redo my actions, so that I can experiment with layouts without fear of making mistakes.

#### Acceptance Criteria

1. THE System SHALL maintain a history of Address_Block state changes in Block_Store
2. THE System SHALL provide Undo and Redo buttons in the interface
3. WHEN a User clicks Undo, THE System SHALL revert to the previous state and update Supabase_Backend
4. WHEN a User clicks Redo, THE System SHALL restore the next state in history and update Supabase_Backend
5. THE System SHALL support keyboard shortcuts (Ctrl+Z for Undo, Ctrl+Y for Redo)
6. THE System SHALL maintain a history limit of 50 actions to prevent memory issues

### Requirement 13: Keyboard Shortcuts

**User Story:** As a User, I want to use keyboard shortcuts for common actions, so that I can work more efficiently.

#### Acceptance Criteria

1. WHEN a User presses Delete key with an Address_Block selected, THE System SHALL delete that Address_Block
2. WHEN a User presses Ctrl+D with an Address_Block selected, THE System SHALL duplicate that Address_Block
3. WHEN a User presses Ctrl+Z, THE System SHALL perform Undo action
4. WHEN a User presses Ctrl+Y, THE System SHALL perform Redo action
5. WHEN a User presses Escape key, THE System SHALL deselect the currently selected Address_Block

### Requirement 14: Responsive UI Components

**User Story:** As a User, I want a clean and intuitive interface, so that I can focus on creating my address book without distraction.

#### Acceptance Criteria

1. THE System SHALL use shadcn/ui components for consistent UI design
2. THE System SHALL use Tailwind CSS for styling with a white theme
3. THE System SHALL provide rounded corners, subtle shadows, and minimalist spacing
4. THE System SHALL ensure the Layout_Canvas preview matches the exported PDF styling exactly
5. THE System SHALL display loading states during data fetching and PDF generation
6. THE System SHALL provide error messages with clear actionable guidance when operations fail

### Requirement 15: Data Validation

**User Story:** As a User, I want the system to validate my input, so that I don't create invalid address blocks.

#### Acceptance Criteria

1. THE System SHALL use Zod schemas to validate Address_Block data before saving
2. THE System SHALL require at least one name in the names array
3. THE System SHALL validate that mobile numbers contain only digits, spaces, hyphens, and parentheses
4. THE System SHALL limit address field to 500 characters
5. THE System SHALL limit each name entry to 100 characters
6. WHEN validation fails, THE System SHALL display inline error messages next to the invalid fields
7. THE System SHALL prevent saving until all validation errors are resolved

### Requirement 16: Block Selection and Highlighting

**User Story:** As a User, I want to see which block is currently selected, so that I know which block I'm editing.

#### Acceptance Criteria

1. WHEN a User clicks an Address_Block in the Layout_Canvas, THE System SHALL highlight it with a distinct border color
2. THE System SHALL update selectedBlockId in Block_Store when selection changes
3. THE System SHALL synchronize selection between Layout_Canvas and Block_Editor
4. WHEN a User clicks empty space in the Layout_Canvas, THE System SHALL deselect the current Address_Block
5. THE System SHALL display the selected Address_Block with a blue border and unselected blocks with light grey borders

### Requirement 17: Grid Layout Configuration

**User Story:** As a User, I want blocks to align to a grid, so that my layout looks organized and professional.

#### Acceptance Criteria

1. THE System SHALL default to a 3×3 grid layout per Page
2. THE System SHALL define Grid_Unit dimensions based on A4 page size with print margins
3. THE System SHALL snap Address_Block positions to Grid_Unit boundaries during drag operations
4. THE System SHALL snap Address_Block dimensions to Grid_Unit increments during resize operations
5. THE System SHALL display grid lines in the Layout_Canvas as visual guides (optional toggle)

### Requirement 18: Database Schema and Relationships

**User Story:** As a developer, I want a well-structured database schema, so that the application can scale and maintain data integrity.

#### Acceptance Criteria

1. THE Supabase_Backend SHALL define an address_blocks table with columns: id (uuid primary key), names (text[]), address (text), mobile (text), x (integer), y (integer), width (integer), height (integer), page_number (integer), created_at (timestamp), updated_at (timestamp), user_id (uuid foreign key)
2. THE System SHALL filter Address_Blocks by user_id in server actions to ensure Users can only access their own Address_Blocks
3. THE Supabase_Backend SHALL create an index on user_id for query performance
4. THE Supabase_Backend SHALL create an index on page_number for efficient page-based queries
5. THE Supabase_Backend SHALL set default values: width=1, height=1, x=0, y=0, page_number=1

### Requirement 19: Error Handling and User Feedback

**User Story:** As a User, I want clear feedback when something goes wrong, so that I can understand and resolve issues.

#### Acceptance Criteria

1. WHEN a database operation fails, THE System SHALL display a toast notification with the error message
2. WHEN PDF generation fails, THE System SHALL display an error dialog with troubleshooting steps
3. WHEN authentication fails, THE System SHALL display an error message on the login form
4. THE System SHALL log errors to the browser console for debugging purposes
5. THE System SHALL provide a "Retry" button for failed operations where applicable

### Requirement 20: Performance Optimization

**User Story:** As a User, I want the application to respond quickly, so that I can work efficiently without delays.

#### Acceptance Criteria

1. THE Layout_Canvas SHALL render updates within 100ms of state changes
2. THE System SHALL debounce autosave operations to batch rapid changes within 500ms
3. THE System SHALL lazy-load Pages in the Layout_Canvas to improve performance with large layouts
4. THE System SHALL optimize re-renders using React.memo and useMemo for expensive components
5. THE PDF_Export_Engine SHALL generate PDFs for layouts with up to 100 Address_Blocks within 5 seconds
