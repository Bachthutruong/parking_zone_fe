import api from './api';
import type { SystemSettings } from '@/types';

// Get system settings
export const getSystemSettings = async (): Promise<SystemSettings> => {
  const response = await api.get('/system-settings');
  return response.data.settings;
};

// Update system settings (admin only)
export const updateSystemSettings = async (settings: Partial<SystemSettings>) => {
  const response = await api.put('/system-settings', settings);
  return response.data;
};

// Get booking terms and rules
export const getBookingTerms = async () => {
  const response = await api.get('/system-settings/booking-terms');
  return response.data;
};

// Update booking terms and rules (admin only)
export const updateBookingTerms = async (terms: { bookingTerms: string; bookingRules: string }) => {
  const response = await api.put('/system-settings/booking-terms', terms);
  return response.data;
};

// Get parking lot types configuration
export const getParkingLotTypes = async () => {
  const response = await api.get('/system-settings/parking-lot-types');
  return response.data.types;
};

// Update parking lot types configuration (admin only)
export const updateParkingLotTypes = async (types: any[]) => {
  const response = await api.put('/system-settings/parking-lot-types', { types });
  return response.data;
}; 