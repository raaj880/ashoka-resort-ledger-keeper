// Centralized constants for data consistency across the application
export const ROOM_TYPES = [
  "Standard Room",
  "Deluxe Room", 
  "Suite",
  "Family Room",
  "Pool View Room"
] as const;

export const INCOME_SOURCES = [
  "Rooms",
  "Restaurant", 
  "Pool",
  "Café"
] as const;

export const EXPENSE_CATEGORIES = [
  "Groceries",
  "Staff Salary",
  "Purchases", 
  "Electricity",
  "Maintenance",
  "Marketing",
  "Transportation",
  "Miscellaneous"
] as const;

export const AMENITIES = [
  "AC",
  "TV", 
  "WiFi",
  "Mini Fridge",
  "Balcony",
  "Pool View",
  "Extra Beds",
  "Parking",
  "Room Service",
  "Kitchenette",
  "Bathtub",
  "Safe"
] as const;

export const BOOKING_STATUSES = [
  "confirmed",
  "checked_in", 
  "checked_out",
  "cancelled"
] as const;

export const ROOM_AVAILABILITY_STATUSES = [
  "available",
  "occupied",
  "maintenance", 
  "blocked"
] as const;

export const STAFF_POSITIONS = [
  "Manager",
  "Receptionist",
  "Chef", 
  "Waiter/Waitress",
  "Housekeeper",
  "Maintenance",
  "Security Guard",
  "Pool Attendant",
  "Kitchen Helper",
  "Other"
] as const;

export const INVENTORY_CATEGORIES = [
  "Food & Beverages",
  "Cleaning Supplies",
  "Linens & Towels", 
  "Kitchen Equipment",
  "Room Amenities",
  "Maintenance Supplies",
  "Office Supplies",
  "Pool Chemicals",
  "Furniture",
  "Electronics",
  "Safety Equipment",
  "Other"
] as const;

export const INVENTORY_UNITS = [
  "pieces",
  "kg",
  "liters",
  "packets",
  "boxes", 
  "bottles",
  "rolls",
  "sets",
  "meters",
  "grams",
  "ml",
  "dozen",
  "pairs",
  "units"
] as const;

// Default room pricing by type
export const DEFAULT_ROOM_PRICES = {
  "Standard Room": 2500,
  "Deluxe Room": 3500,
  "Suite": 5000,
  "Family Room": 4000,
  "Pool View Room": 3000
} as const;

// Default room capacity by type
export const DEFAULT_ROOM_CAPACITY = {
  "Standard Room": 2,
  "Deluxe Room": 3,
  "Suite": 4,
  "Family Room": 6,
  "Pool View Room": 2
} as const;

// Date format constants
export const DATE_FORMATS = {
  DATABASE: 'yyyy-MM-dd',
  DISPLAY: 'MMM d, yyyy',
  DISPLAY_FULL: 'EEEE, MMMM d, yyyy',
  INPUT: 'yyyy-MM-dd'
} as const;

// Currency formatting
export const CURRENCY_CONFIG = {
  locale: 'en-IN',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
} as const;

export type RoomType = typeof ROOM_TYPES[number];
export type IncomeSource = typeof INCOME_SOURCES[number];
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type Amenity = typeof AMENITIES[number];
export type BookingStatus = typeof BOOKING_STATUSES[number];
export type RoomAvailabilityStatus = typeof ROOM_AVAILABILITY_STATUSES[number];
export type StaffPosition = typeof STAFF_POSITIONS[number];
export type InventoryCategory = typeof INVENTORY_CATEGORIES[number];
export type InventoryUnit = typeof INVENTORY_UNITS[number];