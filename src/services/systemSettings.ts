import api from './api';
import type { SystemSettings } from '@/types';

// Get system settings
export const getSystemSettings = async (): Promise<SystemSettings> => {
  const response = await api.get('/admin/settings');
  return response.data;
};

// Update system settings (admin only)
export const updateSystemSettings = async (settings: Partial<SystemSettings>) => {
  const response = await api.put('/admin/settings', settings);
  return response.data;
};

// Get booking terms and rules
export const getBookingTerms = async () => {
  const response = await api.get('/admin/settings');
  return response.data;
};

// Update booking terms and rules (admin only)
export const updateBookingTerms = async (terms: { bookingTerms: string; bookingRules: string }) => {
  const response = await api.put('/admin/settings', terms);
  return response.data;
};

 