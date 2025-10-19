import api from './api';

export interface MaintenanceDay {
  _id: string;
  date: string;
  reason: string;
  description?: string;
  isActive: boolean;
  affectedParkingTypes: Array<{
    _id: string;
    name: string;
    code: string;
  }>;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaintenanceDayData {
  date: string;
  reason: string;
  description?: string;
  affectedParkingTypes: string[];
}

export interface UpdateMaintenanceDayData {
  date?: string;
  reason?: string;
  description?: string;
  affectedParkingTypes?: string[];
  isActive?: boolean;
}

// Get all maintenance days
export const getAllMaintenanceDays = async (params?: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}) => {
  const response = await api.get('/maintenance', { params });
  return response.data;
};

// Create maintenance day
export const createMaintenanceDay = async (data: CreateMaintenanceDayData) => {
  const response = await api.post('/maintenance', data);
  return response.data;
};

// Update maintenance day
export const updateMaintenanceDay = async (id: string, data: UpdateMaintenanceDayData) => {
  const response = await api.put(`/maintenance/${id}`, data);
  return response.data;
};

// Delete maintenance day
export const deleteMaintenanceDay = async (id: string) => {
  const response = await api.delete(`/maintenance/${id}`);
  return response.data;
};

// Get maintenance day by ID
export const getMaintenanceDayById = async (id: string) => {
  const response = await api.get(`/maintenance/${id}`);
  return response.data;
};

// Check maintenance days for date range
export const checkMaintenanceDays = async (startDate: string, endDate: string) => {
  const response = await api.get('/maintenance/check/range', {
    params: { startDate, endDate }
  });
  return response.data;
};

// Check if a specific parking type is affected by maintenance on a date range
export const checkParkingTypeMaintenance = async (parkingTypeId: string, startDate: string, endDate: string) => {
  try {
    const response = await api.get(`/maintenance/check/range?startDate=${startDate}&endDate=${endDate}`);
    
    const maintenanceDays = response.data.maintenanceDays || [];
    
    // Check if any maintenance day affects this parking type
    const affectingMaintenance = maintenanceDays.filter((maintenance: MaintenanceDay) => {
      const isActive = maintenance.isActive;
      const affectsThisParkingType = maintenance.affectedParkingTypes.some((type: any) => type._id === parkingTypeId);
      
      // Normalize dates for comparison (ignore time)
      const maintenanceDate = new Date(maintenance.date);
      maintenanceDate.setHours(0, 0, 0, 0);
      
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      const isInDateRange = maintenanceDate >= start && maintenanceDate <= end;
      
      
      return isActive && affectsThisParkingType && isInDateRange;
    });
    
    return {
      hasMaintenance: affectingMaintenance.length > 0,
      maintenanceDays: affectingMaintenance
    };
  } catch (error) {
    console.error('Error checking maintenance:', error);
    return {
      hasMaintenance: false,
      maintenanceDays: []
    };
  }
}; 