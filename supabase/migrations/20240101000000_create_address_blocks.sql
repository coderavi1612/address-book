-- Create address_blocks table
CREATE TABLE address_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  names TEXT[] NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  mobile TEXT NOT NULL DEFAULT '',
  x INTEGER NOT NULL DEFAULT 0,
  y INTEGER NOT NULL DEFAULT 0,
  width INTEGER NOT NULL DEFAULT 1,
  height INTEGER NOT NULL DEFAULT 1,
  page_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  CONSTRAINT names_not_empty CHECK (array_length(names, 1) > 0),
  CONSTRAINT positive_dimensions CHECK (width > 0 AND height > 0),
  CONSTRAINT positive_position CHECK (x >= 0 AND y >= 0),
  CONSTRAINT positive_page CHECK (page_number > 0)
);

-- Create indexes
CREATE INDEX idx_address_blocks_user_id ON address_blocks(user_id);
CREATE INDEX idx_address_blocks_page_number ON address_blocks(page_number);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_address_blocks_updated_at
  BEFORE UPDATE ON address_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
