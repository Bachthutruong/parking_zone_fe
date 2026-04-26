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
  const response = await api.get('/bookings/available-parking-types', { params });
  return response.data.parkingTypes;
};

// Today's availability for all parking types (sidebar)
export interface TodayParkingAvailability {
  id: string;
  name: string;
  totalSpaces: number;
  availableSpaces: number;
  occupiedSpaces: number;
}
export const getTodayAvailability = async (): Promise<{ date: string; parking: TodayParkingAvailability[] }> => {
  const response = await api.get('/parking/today-availability');
  return response.data;
};

export type SlotSnapshotLot = {
  parkingType: {
    _id: string;
    name: string;
    code: string;
    icon: string;
    color: string;
    totalSpaces: number;
  };
  at: string;
  slots: { slotNumber: number; booking: {
    _id: string;
    createdAt?: string;
    licensePlate: string;
    driverName: string;
    phone: string;
    checkInTime: string;
    checkOutTime: string;
    finalAmount: number;
    status: string;
    vehicleCount?: number;
    actualCheckInTime?: string;
  } | null }[];
  unassignedCheckedIn: Array<{
    _id: string;
    licensePlate: string;
    driverName: string;
    phone: string;
  }>;
};

export const getParkingSlotSnapshot = async (at?: string): Promise<{ serverTime: string; lots: SlotSnapshotLot[] }> => {
  const response = await api.get('/parking/slot-snapshot', { params: at ? { at } : undefined });
  return response.data;
};

export const getCheckinFreeSlots = async (parkingTypeId: string, excludeBookingId?: string): Promise<{
  totalSpaces: number;
  freeSlots: number[];
  takenCount: number;
}> => {
  const response = await api.get(`/parking/${parkingTypeId}/checkin-free-slots`, {
    params: excludeBookingId ? { excludeBookingId } : undefined,
  });
  return response.data;
};