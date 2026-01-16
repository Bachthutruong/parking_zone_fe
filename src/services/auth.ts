import api from './api';
import { User, RegisterData, LoginData } from '../types';

export const register = async (userData: RegisterData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const login = async (loginData: LoginData) => {
  const response = await api.post('/auth/login', loginData);
  return response.data;
};

export const getProfile = async (): Promise<User> => {
  const response = await api.get('/auth/profile');
  return response.data.user;
};

export const updateProfile = async (userData: Partial<User>) => {
  const response = await api.put('/auth/profile', userData);
  return response.data;
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const response = await api.put('/auth/change-password', {
    currentPassword,
    newPassword,
  });
  return response.data;
};

export const getBookingTerms = async (): Promise<{ terms: string }> => {
  const response = await api.get('/auth/booking-terms');
  return response.data;
};

// Check VIP status by phone
export const checkVIPStatus = async (phone: string) => {
  const response = await api.post('/auth/check-vip', { phone });
  return response.data;
};

// Check VIP status by VIP code
export const checkVIPByCode = async (vipCode: string) => {
  const response = await api.post('/auth/check-vip-code', { vipCode });
  return response.data;
}; 