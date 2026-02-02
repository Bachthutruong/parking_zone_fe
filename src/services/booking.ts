import api from './api';
import type { Booking, ParkingType } from '@/types';

export interface CheckAvailabilityParams {
  parkingTypeId: string;
  checkInTime: string;
  checkOutTime: string;
  /** When editing a booking, pass its ID so it is excluded from the count (its slot is treated as free). */
  excludeBookingId?: string;
  /** Include debug info in response (perDayOccupancy, maxOccupied) for verification. */
  debug?: boolean;
}

export interface AvailableParkingTypesParams {
  type: string;
  checkInTime: string;
  checkOutTime: string;
}

export interface CreateBookingParams {
  parkingTypeId: string;
  checkInTime: string;
  checkOutTime: string;
  driverName: string;
  phone: string;
  email: string;
  licensePlate: string;
  passengerCount: number;
  luggageCount: number;
  addonServices: string[];
  discountCode?: string;
  estimatedArrivalTime?: string;
  flightNumber?: string;
  notes?: string;
}

export interface CalculatePriceParams {
  parkingTypeId: string;
  checkInTime: string;
  checkOutTime: string;
  addonServices: string[];
  discountCode?: string;
  isVIP?: boolean;
  userEmail?: string;
}

// Get booking terms
export const getBookingTerms = async () => {
  const response = await api.get('/bookings/terms');
  return response.data;
};

// Check availability
export const checkAvailability = async (params: CheckAvailabilityParams) => {
  const response = await api.post('/bookings/check-availability', params);
  return response.data;
};

// Get available parking types by type
export const getAvailableParkingTypes = async (params: AvailableParkingTypesParams): Promise<ParkingType[]> => {
  const response = await api.get('/bookings/available-parking-types', { params });
  return response.data.parkingTypes;
};

// Calculate price
export const calculatePrice = async (params: CalculatePriceParams) => {
  const response = await api.post('/bookings/calculate-price', params);
  return response.data;
};

// Create booking
export const createBooking = async (params: CreateBookingParams) => {
  const response = await api.post('/bookings', params);
  return response.data;
};

// Get booking by search
export const getBookingBySearch = async (phone?: string, licensePlate?: string): Promise<Booking[]> => {
  const params: any = {};
  if (phone) params.phone = phone;
  if (licensePlate) params.licensePlate = licensePlate;
  
  const response = await api.get('/bookings/search', { params });
  return response.data.bookings;
};

// Get booking details
export const getBookingDetails = async (id: string): Promise<Booking> => {
  const response = await api.get(`/bookings/${id}`);
  return response.data.booking;
};

// Update booking status
export const updateBookingStatus = async (id: string, status: string, notes?: string) => {
  const response = await api.put(`/bookings/${id}/status`, { status, notes });
  return response.data;
}; 