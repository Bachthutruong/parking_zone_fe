import api from './api';
import type { ParkingType } from '@/types';

export interface AvailableParkingTypesParams {
  type: string;
  checkInTime: string;
  checkOutTime: string;
}

// Get all parking types
export const getAllParkingTypes = async (): Promise<ParkingType[]> => {
  const response = await api.get('/parking');
  return response.data.parkingTypes;
};

// Get parking type by ID
export const getParkingTypeById = async (id: string): Promise<ParkingType> => {
  const response = await api.get(`/parking/${id}`);
  return response.data.parkingType;
};

// Get parking type availability for a specific date
export const getParkingTypeAvailability = async (id: string, date: string) => {
  const response = await api.get(`/parking/${id}/availability?date=${date}`);
  return response.data;
};

// Get available parking types by type
export const getAvailableParkingTypes = async (params: AvailableParkingTypesParams): Promise<ParkingType[]> => {
  const response = await api.get('/bookings/available-types', { params });
  return response.data.parkingTypes;
}; 