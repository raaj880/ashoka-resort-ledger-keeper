
-- Create a table for transactions (both income and expenses)
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  source TEXT, -- For income sources (Rooms, Restaurant, Pool, Café)
  category TEXT, -- For expense categories (Groceries, Staff Salary, etc.)
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create an index on date for faster queries
CREATE INDEX idx_transactions_date ON public.transactions(date);

-- Create an index on type for faster filtering
CREATE INDEX idx_transactions_type ON public.transactions(type);

-- Enable Row Level Security (RLS) - for now we'll allow all operations
-- In a production environment, you'd want to restrict based on user roles
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations for now
-- You can modify these later to restrict access based on user roles
CREATE POLICY "Allow all operations on transactions" 
  ON public.transactions 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON public.transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();
