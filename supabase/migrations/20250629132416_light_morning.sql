/*
  # Create inventory table

  1. New Tables
    - `inventory`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `category` (text, required)
      - `quantity` (integer, required, >= 0)
      - `unit` (text, required)
      - `min_quantity` (integer, defaults to 0)
      - `unit_price` (numeric, defaults to 0)
      - `supplier` (text, optional)
      - `notes` (text, optional)
      - `last_updated` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `inventory` table
    - Add policy for all operations (can be restricted later)

  3. Indexes
    - Index on category for filtering
    - Index on name for searching
*/

CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  unit TEXT NOT NULL,
  min_quantity INTEGER NOT NULL DEFAULT 0 CHECK (min_quantity >= 0),
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  supplier TEXT,
  notes TEXT,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_name ON public.inventory(name);

-- Enable Row Level Security
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations (can be restricted later based on user roles)
CREATE POLICY "Allow all operations on inventory"
  ON public.inventory
  FOR ALL
  USING (true)
  WITH CHECK (true);