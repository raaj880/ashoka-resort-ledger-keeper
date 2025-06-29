import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { CURRENCY_CONFIG, DATE_FORMATS } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
    style: 'currency',
    currency: CURRENCY_CONFIG.currency,
    minimumFractionDigits: CURRENCY_CONFIG.minimumFractionDigits,
    maximumFractionDigits: CURRENCY_CONFIG.maximumFractionDigits,
  }).format(amount);
}

export function formatDate(date: Date | string, formatType: keyof typeof DATE_FORMATS = 'DISPLAY'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, DATE_FORMATS[formatType]);
}

export function formatDateForDatabase(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, DATE_FORMATS.DATABASE);
}

export function formatDateForDisplay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, DATE_FORMATS.DISPLAY);
}

export function formatDateForInput(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, DATE_FORMATS.INPUT);
}

export function validatePrice(price: string | number): boolean {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return !isNaN(numPrice) && numPrice >= 0;
}

export function validateCapacity(capacity: string | number): boolean {
  const numCapacity = typeof capacity === 'string' ? parseInt(capacity) : capacity;
  return !isNaN(numCapacity) && numCapacity > 0 && numCapacity <= 20;
}

export function normalizeRoomType(roomType: string): string {
  // Ensure consistent room type formatting
  return roomType.trim();
}

export function normalizeIncomeSource(source: string): string {
  // Handle café/cafe variations
  if (source.toLowerCase() === 'cafe') {
    return 'Café';
  }
  return source.trim();
}

export function normalizeExpenseCategory(category: string): string {
  // Ensure consistent category formatting
  return category.trim();
}