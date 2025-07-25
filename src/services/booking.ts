import api from './api';
import type { ParkingLot } from '@/types';

export interface BookingTerms {
  terms: string;
  rules: string;
  timeSlotInterval: number;
}

export interface AvailableParkingLotsParams {
  type: string;
  checkInTime: string;
  checkOutTime: string;
}

export interface CalculatePriceParams {
  parkingLotId: string;
  checkInTime: string;
  checkOutTime: string;
  addonServices: string[];
  discountCode?: string | null;
  isVIP?: boolean;
}

export interface CreateBookingParams {
  parkingLotId: string;
  checkInTime: string;
  checkOutTime: string;
  driverName: string;
  phone: string;
  email: string;
  licensePlate: string;
  passengerCount: number;
  luggageCount: number;
  addonServices: string[];
  discountCode?: string | null;
  estimatedArrivalTime?: string;
  flightNumber?: string;
  notes?: string;
  termsAccepted: boolean;
}

export interface BookingSearchParams {
  phone?: string;
  licensePlate?: string;
}

// Get booking terms and rules
export const getBookingTerms = async (): Promise<BookingTerms> => {
  const response = await api.get('/bookings/terms');
  return response.data;
};

// Get available parking lots by type
export const getAvailableParkingLots = async (params: AvailableParkingLotsParams): Promise<ParkingLot[]> => {
  const response = await api.get('/bookings/available-lots', { params });
  return response.data.parkingLots;
};

// Calculate booking price
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
export const getBookingBySearch = async (params: BookingSearchParams) => {
  const response = await api.get('/bookings/search', { params });
  return response.data;
};

// Get booking details
export const getBookingDetails = async (id: string) => {
  const response = await api.get(`/bookings/${id}`);
  return response.data;
};

// Update booking status
export const updateBookingStatus = async (id: string, status: string, notes?: string) => {
  const response = await api.patch(`/bookings/${id}/status`, { status, notes });
  return response.data;
};

// Get user bookings
export const getMyBookings = async () => {
  const response = await api.get('/bookings/my-bookings');
  return response.data;
};

// Cancel booking
export const cancelBooking = async (id: string) => {
  const response = await api.put(`/bookings/${id}/cancel`);
  return response.data;
}; 