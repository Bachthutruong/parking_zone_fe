import api from './api';
import type { AddonService } from '@/types';

// Get all addon services
export const getAllAddonServices = async (): Promise<AddonService[]> => {
  const response = await api.get('/addon-services');
  return response.data.services;
};

// Get addon service by ID
export const getAddonServiceById = async (id: string): Promise<AddonService> => {
  const response = await api.get(`/addon-services/${id}`);
  return response.data.service;
};

// Get addon services by category
export const getAddonServicesByCategory = async (category: string): Promise<AddonService[]> => {
  const response = await api.get(`/addon-services/category/${category}`);
  return response.data.services;
};

// Create addon service (admin only)
export const createAddonService = async (serviceData: Partial<AddonService>) => {
  const response = await api.post('/addon-services', serviceData);
  return response.data;
};

// Update addon service (admin only)
export const updateAddonService = async (id: string, serviceData: Partial<AddonService>) => {
  const response = await api.put(`/addon-services/${id}`, serviceData);
  return response.data;
};

// Delete addon service (admin only)
export const deleteAddonService = async (id: string) => {
  const response = await api.delete(`/addon-services/${id}`);
  return response.data;
};

// Toggle addon service status (admin only)
export const toggleAddonServiceStatus = async (id: string) => {
  const response = await api.patch(`/addon-services/${id}/toggle`);
  return response.data;
};

// Initialize default services (admin only)
export const initializeDefaultServices = async () => {
  const response = await api.post('/addon-services/initialize-defaults');
  return response.data;
};

// Update service order (admin only)
export const updateServiceOrder = async (services: { id: string; sortOrder: number }[]) => {
  const response = await api.put('/addon-services/update-order', { services });
  return response.data;
}; 