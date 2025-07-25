import api from './api';
import type { DiscountCode } from '@/types';

export interface ValidateDiscountCodeParams {
  code: string;
  amount: number;
}

// Get all discount codes (admin only)
export const getAllDiscountCodes = async (): Promise<DiscountCode[]> => {
  const response = await api.get('/discount-codes');
  return response.data.codes;
};

// Get active discount codes
export const getActiveDiscountCodes = async (): Promise<DiscountCode[]> => {
  const response = await api.get('/discount-codes/active');
  return response.data.codes;
};

// Get discount code by ID (admin only)
export const getDiscountCodeById = async (id: string): Promise<DiscountCode> => {
  const response = await api.get(`/discount-codes/${id}`);
  return response.data.code;
};

// Validate discount code
export const validateDiscountCode = async (params: ValidateDiscountCodeParams) => {
  const response = await api.post('/discount-codes/validate', params);
  return response.data;
};

// Create discount code (admin only)
export const createDiscountCode = async (codeData: Partial<DiscountCode>) => {
  const response = await api.post('/discount-codes', codeData);
  return response.data;
};

// Update discount code (admin only)
export const updateDiscountCode = async (id: string, codeData: Partial<DiscountCode>) => {
  const response = await api.put(`/discount-codes/${id}`, codeData);
  return response.data;
};

// Delete discount code (admin only)
export const deleteDiscountCode = async (id: string) => {
  const response = await api.delete(`/discount-codes/${id}`);
  return response.data;
};

// Toggle discount code status (admin only)
export const toggleDiscountCodeStatus = async (id: string) => {
  const response = await api.patch(`/discount-codes/${id}/toggle`);
  return response.data;
};

// Get discount code statistics (admin only)
export const getDiscountCodeStats = async (id: string) => {
  const response = await api.get(`/discount-codes/${id}/stats`);
  return response.data;
}; 