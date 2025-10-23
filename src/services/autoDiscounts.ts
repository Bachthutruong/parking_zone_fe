import api from './api';

export interface AutoDiscount {
  _id: string;
  name: string;
  description: string;
  minDays: number;
  maxDays?: number;
  applicableParkingTypes: Array<{
    _id: string;
    name: string;
    type: string;
  }>;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number;
  applyToSpecialPrices: boolean;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  priority: number;
  usageCount: number;
  maxUsage: number;
  userRestrictions: {
    newUsersOnly: boolean;
    vipOnly: boolean;
    specificUsers: string[];
  };
  conditions: {
    minBookingAmount?: number;
    maxBookingAmount?: number;
    specificDaysOfWeek?: number[];
    specificTimeSlots?: Array<{
      startTime: string;
      endTime: string;
    }>;
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  lastModifiedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AutoDiscountStats {
  overview: {
    totalDiscounts: number;
    activeDiscounts: number;
    totalUsage: number;
    avgPriority: number;
  };
  byType: Array<{
    _id: string;
    count: number;
    totalUsage: number;
  }>;
}

export interface CreateAutoDiscountData {
  name: string;
  description: string;
  minDays: number;
  maxDays?: number;
  applicableParkingTypes: string[];
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number;
  applyToSpecialPrices: boolean;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  priority: number;
  maxUsage: number;
  userRestrictions: {
    newUsersOnly: boolean;
    vipOnly: boolean;
    specificUsers: string[];
  };
  conditions: {
    minBookingAmount?: number;
    maxBookingAmount?: number;
    specificDaysOfWeek?: number[];
    specificTimeSlots?: Array<{
      startTime: string;
      endTime: string;
    }>;
  };
}

export interface AutoDiscountFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

// Get all auto discounts
export const getAllAutoDiscounts = async (filters: AutoDiscountFilters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());

    const response = await api.get(`/auto-discounts?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error getting auto discounts:', error);
    throw error;
  }
};

// Get single auto discount
export const getAutoDiscountById = async (id: string) => {
  try {
    const response = await api.get(`/auto-discounts/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error getting auto discount:', error);
    throw error;
  }
};

// Create auto discount
export const createAutoDiscount = async (data: CreateAutoDiscountData) => {
  try {
    const response = await api.post('/auto-discounts', data);
    return response.data;
  } catch (error) {
    console.error('Error creating auto discount:', error);
    throw error;
  }
};

// Update auto discount
export const updateAutoDiscount = async (id: string, data: Partial<CreateAutoDiscountData>) => {
  try {
    const response = await api.put(`/auto-discounts/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating auto discount:', error);
    throw error;
  }
};

// Delete auto discount
export const deleteAutoDiscount = async (id: string) => {
  try {
    const response = await api.delete(`/auto-discounts/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting auto discount:', error);
    throw error;
  }
};

// Toggle auto discount status
export const toggleAutoDiscountStatus = async (id: string) => {
  try {
    const response = await api.patch(`/auto-discounts/${id}/toggle`);
    return response.data;
  } catch (error) {
    console.error('Error toggling auto discount status:', error);
    throw error;
  }
};

// Get applicable auto discounts for booking
export const getApplicableAutoDiscounts = async (bookingData: {
  parkingTypeId: string;
  checkInTime: string;
  checkOutTime: string;
  totalAmount: number;
  isVIP: boolean;
  userId?: string;
}) => {
  try {
    const response = await api.get('/auto-discounts/applicable', {
      params: bookingData
    });
    return response.data;
  } catch (error) {
    console.error('Error getting applicable auto discounts:', error);
    throw error;
  }
};

// Get auto discount statistics
export const getAutoDiscountStats = async () => {
  try {
    const response = await api.get('/auto-discounts/stats');
    return response.data;
  } catch (error) {
    console.error('Error getting auto discount stats:', error);
    throw error;
  }
};

// Get all parking types (for form dropdown)
export const getAllParkingTypes = async () => {
  try {
    const response = await api.get('/parking/types');
    return response.data;
  } catch (error) {
    console.error('Error getting parking types:', error);
    throw error;
  }
};
