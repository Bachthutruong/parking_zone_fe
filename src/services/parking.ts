import api from './api';
import { ParkingLot } from '../types';

export const getParkingLots = async (): Promise<ParkingLot[]> => {
  const response = await api.get('/parking');
  return response.data.parkingLots;
};

export const getParkingLotById = async (id: string): Promise<ParkingLot> => {
  const response = await api.get(`/parking/${id}`);
  return response.data.parkingLot;
};

export const getParkingLotsByType = async (type: 'indoor' | 'outdoor' | 'disabled'): Promise<ParkingLot[]> => {
  const response = await api.get(`/parking/type/${type}`);
  return response.data.parkingLots;
};

// Create parking lot (admin only)
export const createParkingLot = async (parkingLotData: Partial<ParkingLot>) => {
  const response = await api.post('/parking', parkingLotData);
  return response.data;
};

// Update parking lot (admin only)
export const updateParkingLot = async (id: string, parkingLotData: Partial<ParkingLot>) => {
  const response = await api.put(`/parking/${id}`, parkingLotData);
  return response.data;
};

// Delete parking lot (admin only)
export const deleteParkingLot = async (id: string) => {
  const response = await api.delete(`/parking/${id}`);
  return response.data;
}; 