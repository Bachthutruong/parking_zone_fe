import api from './api';
import { DashboardStats, Booking, User, ParkingLot, SystemSettings, BookingStats, ParkingLotStats, CurrentParkingStatus } from '../types';

// Dashboard
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/admin/dashboard');
  return response.data;
};

export const getRecentBookings = async (): Promise<Booking[]> => {
  const response = await api.get('/admin/bookings/recent');
  return response.data.bookings;
};

export const getBookingStats = async (period: string): Promise<BookingStats> => {
  const response = await api.get(`/admin/bookings/stats/${period}`);
  return response.data;
};

export const getParkingLotStats = async (): Promise<ParkingLotStats[]> => {
  const response = await api.get('/admin/parking-lots/stats');
  return response.data.parkingLots;
};

export const getCurrentParkingStatus = async (): Promise<CurrentParkingStatus> => {
  const response = await api.get('/admin/parking/current-status');
  return response.data;
};

// Bookings Management
export const getAllBookings = async (params?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}): Promise<{ bookings: Booking[]; total: number; page: number; totalPages: number }> => {
  const response = await api.get('/admin/bookings', { params });
  return response.data;
};

export const updateBookingStatus = async (bookingId: string, status: string) => {
  const response = await api.put(`/admin/bookings/${bookingId}/status`, { status });
  return response.data;
};

export const updateBooking = async (bookingId: string, bookingData: Partial<Booking>) => {
  const response = await api.put(`/admin/bookings/${bookingId}`, bookingData);
  return response.data;
};

// Users Management
export const getAllUsers = async (params?: {
  role?: string;
  isVIP?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ users: User[]; total: number; page: number; totalPages: number }> => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

export const updateUserVIP = async (userId: string, isVIP: boolean) => {
  const response = await api.put(`/admin/users/${userId}/vip`, { isVIP });
  return response.data;
};

export const updateUser = async (userId: string, userData: Partial<User>) => {
  const response = await api.put(`/admin/users/${userId}`, userData);
  return response.data;
};

export const createUser = async (userData: Partial<User>) => {
  const response = await api.post('/admin/users', userData);
  return response.data;
};

export const deleteUser = async (userId: string) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

// Parking Lots Management
export const getAllParkingLots = async (params?: {
  type?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ parkingLots: ParkingLot[]; total: number; page: number; totalPages: number }> => {
  const response = await api.get('/admin/parking-lots', { params });
  return response.data;
};

export const createParkingLot = async (parkingLotData: Partial<ParkingLot>) => {
  const response = await api.post('/admin/parking-lots', parkingLotData);
  return response.data;
};

export const updateParkingLot = async (parkingLotId: string, parkingLotData: Partial<ParkingLot>) => {
  const response = await api.put(`/admin/parking-lots/${parkingLotId}`, parkingLotData);
  return response.data;
};

export const deleteParkingLot = async (parkingLotId: string) => {
  const response = await api.delete(`/admin/parking-lots/${parkingLotId}`);
  return response.data;
};

// Parking Types Management
export const getAllParkingTypes = async () => {
  const response = await api.get('/admin/parking-types');
  return response.data;
};

export const createParkingType = async (parkingTypeData: any) => {
  const response = await api.post('/admin/parking-types', parkingTypeData);
  return response.data;
};

export const updateParkingType = async (type: string, parkingTypeData: any) => {
  const response = await api.put(`/admin/parking-types/${type}`, parkingTypeData);
  return response.data;
};

export const deleteParkingType = async (type: string) => {
  const response = await api.delete(`/admin/parking-types/${type}`);
  return response.data;
};

// Addon Services Management
export const getAllAddonServices = async (params?: {
  category?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ services: any[]; total: number; page: number; totalPages: number }> => {
  const response = await api.get('/admin/addon-services', { params });
  return response.data;
};

export const createAddonService = async (serviceData: any) => {
  const response = await api.post('/admin/addon-services', serviceData);
  return response.data;
};

export const updateAddonService = async (serviceId: string, serviceData: any) => {
  const response = await api.put(`/admin/addon-services/${serviceId}`, serviceData);
  return response.data;
};

export const deleteAddonService = async (serviceId: string) => {
  const response = await api.delete(`/admin/addon-services/${serviceId}`);
  return response.data;
};

// Discount Codes Management
export const getAllDiscountCodes = async (params?: {
  type?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ discountCodes: any[]; total: number; page: number; totalPages: number }> => {
  const response = await api.get('/admin/discount-codes', { params });
  return response.data;
};

export const createDiscountCode = async (discountData: any) => {
  const response = await api.post('/admin/discount-codes', discountData);
  return response.data;
};

export const updateDiscountCode = async (discountId: string, discountData: any) => {
  const response = await api.put(`/admin/discount-codes/${discountId}`, discountData);
  return response.data;
};

export const deleteDiscountCode = async (discountId: string) => {
  const response = await api.delete(`/admin/discount-codes/${discountId}`);
  return response.data;
};

// System Settings
export const getSystemSettings = async (): Promise<SystemSettings> => {
  const response = await api.get('/admin/settings');
  return response.data;
};

export const updateSystemSettings = async (settingsData: Partial<SystemSettings>) => {
  const response = await api.put('/admin/settings', settingsData);
  return response.data;
};

// Manual Booking
export const createManualBooking = async (bookingData: any) => {
  const response = await api.post('/admin/bookings/manual', bookingData);
  return response.data;
};

// Reports
export const getRevenueReport = async (params: {
  dateFrom: string;
  dateTo: string;
  groupBy?: 'day' | 'week' | 'month';
}) => {
  const response = await api.get('/admin/reports/revenue', { params });
  return response.data;
};

export const getOccupancyReport = async (params: {
  dateFrom: string;
  dateTo: string;
  parkingLotId?: string;
}) => {
  const response = await api.get('/admin/reports/occupancy', { params });
  return response.data;
};

// ===== TERMS SERVICES =====

export const getAllTerms = async () => {
  const response = await api.get('/admin/terms');
  return response.data;
};

export const updateTermsSection = async (section: string, data: { content: string; isActive: boolean }) => {
  const response = await api.put(`/admin/terms/${section}`, data);
  return response.data;
};

export const saveAllTerms = async (termsData: any) => {
  const response = await api.post('/admin/terms/save-all', termsData);
  return response.data;
};

// ===== NOTIFICATION TEMPLATE SERVICES =====

export const getAllNotificationTemplates = async (params?: {
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get('/admin/notification-templates', { params });
  return response.data;
};

export const createNotificationTemplate = async (data: {
  name: string;
  type: 'email' | 'sms' | 'push';
  subject?: string;
  content: string;
  description: string;
  variables?: string[];
  isActive?: boolean;
}) => {
  const response = await api.post('/admin/notification-templates', data);
  return response.data;
};

export const updateNotificationTemplate = async (id: string, data: {
  name: string;
  type: 'email' | 'sms' | 'push';
  subject?: string;
  content: string;
  description: string;
  variables?: string[];
  isActive?: boolean;
}) => {
  const response = await api.put(`/admin/notification-templates/${id}`, data);
  return response.data;
};

export const deleteNotificationTemplate = async (id: string) => {
  const response = await api.delete(`/admin/notification-templates/${id}`);
  return response.data;
}; 