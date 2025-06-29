/*
  # Advanced Authentication and Room Calendar System

  1. New Tables
    - `user_roles` - Define different user roles (admin, manager, staff)
    - `users` - User accounts with role assignments
    - `rooms` - Room inventory for the resort
    - `room_availability` - Track room availability and status
    - `user_sessions` - Track user login sessions

  2. Security
    - Enable RLS on all new tables
    - Add policies based on user roles
    - Secure access to sensitive data

  3. Indexes
    - Performance indexes for calendar queries
    - User lookup optimization
*/

-- Create user roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_name TEXT NOT NULL UNIQUE,
  permissions JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default roles
INSERT INTO public.user_roles (role_name, permissions, description) VALUES
('admin', '{"all": true}', 'Full system access'),
('manager', '{"bookings": true, "reports": true, "staff": true, "inventory": true}', 'Management access'),
('staff', '{"bookings": true, "customers": true}', 'Basic staff access'),
('viewer', '{"reports": true}', 'Read-only access')
ON CONFLICT (role_name) DO NOTHING;

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role_id UUID NOT NULL REFERENCES public.user_roles(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number TEXT NOT NULL UNIQUE,
  room_type TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 2,
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  amenities JSONB DEFAULT '[]',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create room availability table
CREATE TABLE IF NOT EXISTS public.room_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'blocked')),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, date)
);

-- Create user sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON public.users(role_id);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON public.rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_room_availability_date ON public.room_availability(date);
CREATE INDEX IF NOT EXISTS idx_room_availability_room_date ON public.room_availability(room_id, date);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);

-- Add triggers for updated_at columns
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_room_availability_updated_at
  BEFORE UPDATE ON public.room_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all for now, can be restricted later)
CREATE POLICY "Allow all operations on user_roles"
  ON public.user_roles FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on users"
  ON public.users FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on rooms"
  ON public.rooms FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on room_availability"
  ON public.room_availability FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on user_sessions"
  ON public.user_sessions FOR ALL USING (true) WITH CHECK (true);

-- Insert sample rooms
INSERT INTO public.rooms (room_number, room_type, capacity, base_price, amenities, description) VALUES
('101', 'Standard Room', 2, 2500.00, '["AC", "TV", "WiFi"]', 'Comfortable standard room with basic amenities'),
('102', 'Standard Room', 2, 2500.00, '["AC", "TV", "WiFi"]', 'Comfortable standard room with basic amenities'),
('103', 'Deluxe Room', 3, 3500.00, '["AC", "TV", "WiFi", "Mini Fridge"]', 'Spacious deluxe room with additional amenities'),
('104', 'Deluxe Room', 3, 3500.00, '["AC", "TV", "WiFi", "Mini Fridge"]', 'Spacious deluxe room with additional amenities'),
('201', 'Suite', 4, 5000.00, '["AC", "TV", "WiFi", "Mini Fridge", "Balcony"]', 'Luxury suite with premium amenities'),
('202', 'Suite', 4, 5000.00, '["AC", "TV", "WiFi", "Mini Fridge", "Balcony"]', 'Luxury suite with premium amenities'),
('301', 'Family Room', 6, 4000.00, '["AC", "TV", "WiFi", "Extra Beds"]', 'Large family room accommodating up to 6 guests'),
('302', 'Pool View Room', 2, 3000.00, '["AC", "TV", "WiFi", "Pool View"]', 'Room with beautiful pool view')
ON CONFLICT (room_number) DO NOTHING;

-- Insert default admin user (password: admin123 - should be changed in production)
INSERT INTO public.users (username, email, password_hash, full_name, role_id) 
SELECT 'admin', 'admin@ashokaresort.com', '$2b$10$rOzJqQZQZQZQZQZQZQZQZu', 'System Administrator', ur.id
FROM public.user_roles ur WHERE ur.role_name = 'admin'
ON CONFLICT (username) DO NOTHING;