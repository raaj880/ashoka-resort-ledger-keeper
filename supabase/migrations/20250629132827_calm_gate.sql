/*
  # Inventory Management Improvements

  1. Triggers
    - Add trigger for automatic last_updated timestamp updates
  
  2. Indexes
    - Add additional indexes for better performance
    
  3. Constraints
    - Add better data validation constraints
*/

-- Create trigger to automatically update the last_updated column
CREATE OR REPLACE FUNCTION public.update_inventory_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_inventory_last_updated_trigger'
    ) THEN
        CREATE TRIGGER update_inventory_last_updated_trigger
            BEFORE UPDATE ON public.inventory
            FOR EACH ROW
            EXECUTE FUNCTION public.update_inventory_last_updated();
    END IF;
END $$;

-- Add additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON public.inventory(quantity, min_quantity) 
WHERE quantity <= min_quantity;

CREATE INDEX IF NOT EXISTS idx_inventory_supplier ON public.inventory(supplier) 
WHERE supplier IS NOT NULL;

-- Add constraint to ensure name is not empty
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'inventory_name_not_empty'
    ) THEN
        ALTER TABLE public.inventory 
        ADD CONSTRAINT inventory_name_not_empty 
        CHECK (trim(name) != '');
    END IF;
END $$;

-- Add constraint to ensure category is not empty
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'inventory_category_not_empty'
    ) THEN
        ALTER TABLE public.inventory 
        ADD CONSTRAINT inventory_category_not_empty 
        CHECK (trim(category) != '');
    END IF;
END $$;

-- Add constraint to ensure unit is not empty
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'inventory_unit_not_empty'
    ) THEN
        ALTER TABLE public.inventory 
        ADD CONSTRAINT inventory_unit_not_empty 
        CHECK (trim(unit) != '');
    END IF;
END $$;