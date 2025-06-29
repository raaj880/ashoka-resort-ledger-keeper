/*
  # Create staff table

  1. New Tables
    - `staff`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `phone` (text, required)
      - `email` (text, optional)
      - `address` (text, optional)
      - `position` (text, required)
      - `salary` (numeric, required, >= 0)
      - `hire_date` (date, defaults to current date)
      - `status` (text, defaults to 'active', must be 'active' or 'inactive')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `staff` table
    - Add policy for all operations (can be restricted later)

  3. Indexes
    - Index on position for filtering
    - Index on status for filtering
*/

CREATE TABLE IF NOT EXISTS public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  position TEXT NOT NULL,
  salary NUMERIC(10,2) NOT NULL CHECK (salary >= 0),
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_position ON public.staff(position);
CREATE INDEX IF NOT EXISTS idx_staff_status ON public.staff(status);

-- Enable Row Level Security
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations (can be restricted later based on user roles)
CREATE POLICY "Allow all operations on staff"
  ON public.staff
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();