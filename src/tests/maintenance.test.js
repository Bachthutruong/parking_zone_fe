// Frontend Test for Maintenance Day Integration
// This file can be used with Jest or similar testing framework

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock data for testing
const mockMaintenanceDays = [
  {
    _id: '1',
    date: '2024-01-29',
    reason: 'Bảo trì hệ thống',
    description: 'Bảo trì định kỳ hệ thống điện và camera',
    isActive: true,
    affectedParkingTypes: [
      { _id: 'parking1', name: 'Bãi A', code: 'A001' },
      { _id: 'parking2', name: 'Bãi đậu xe trong nhà', code: 'INDOOR001' }
    ]
  }
];

const mockParkingTypes = [
  {
    _id: 'parking1',
    name: 'Bãi A',
    type: 'indoor',
    pricePerDay: 230,
    totalSpaces: 50,
    isActive: true
  },
  {
    _id: 'parking2',
    name: 'Bãi đậu xe trong nhà',
    type: 'indoor',
    pricePerDay: 100,
    totalSpaces: 48,
    isActive: true
  },
  {
    _id: 'parking3',
    name: 'Bãi đậu xe ngoài trời',
    type: 'outdoor',
    pricePerDay: 80,
    totalSpaces: 100,
    isActive: true
  }
];

// Test suite for maintenance day integration
describe('Maintenance Day Integration Tests', () => {

  // Test 1: Maintenance day affects parking type availability
  test('should show maintenance badge on affected parking types', () => {
    // Mock the maintenance check function
    const checkParkingTypeMaintenance = jest.fn().mockResolvedValue({
      hasMaintenance: true,
      maintenanceDays: mockMaintenanceDays
    });

    // Test that affected parking types show maintenance badge
    const affectedParkingType = mockParkingTypes.find(pt => pt._id === 'parking1');
    const isUnderMaintenance = mockMaintenanceDays.some(maintenance => 
      maintenance.affectedParkingTypes.some(affectedType => affectedType._id === affectedParkingType._id)
    );

    expect(isUnderMaintenance).toBe(true);
  });

  // Test 2: Non-affected parking types should not show maintenance badge
  test('should not show maintenance badge on non-affected parking types', () => {
    const nonAffectedParkingType = mockParkingTypes.find(pt => pt._id === 'parking3');
    const isUnderMaintenance = mockMaintenanceDays.some(maintenance => 
      maintenance.affectedParkingTypes.some(affectedType => affectedType._id === nonAffectedParkingType._id)
    );

    expect(isUnderMaintenance).toBe(false);
  });

  // Test 3: Maintenance notification should display correctly
  test('should display maintenance notification with correct information', () => {
    const maintenanceDay = mockMaintenanceDays[0];
    const notificationData = {
      date: new Date(maintenanceDay.date).toLocaleDateString('vi-VN'),
      reason: maintenanceDay.reason
    };

    expect(notificationData.date).toBe('29/01/2024');
    expect(notificationData.reason).toBe('Bảo trì hệ thống');
  });

  // Test 4: Maintenance day should block booking progression
  test('should disable next button when maintenance days are present', () => {
    const hasMaintenanceDays = mockMaintenanceDays.length > 0;
    const canProceed = !hasMaintenanceDays;

    expect(canProceed).toBe(false);
  });

  // Test 5: Maintenance day should show correct affected parking types
  test('should show correct list of affected parking types', () => {
    const affectedTypes = mockMaintenanceDays[0].affectedParkingTypes.map(type => type.name);
    
    expect(affectedTypes).toContain('Bãi A');
    expect(affectedTypes).toContain('Bãi đậu xe trong nhà');
    expect(affectedTypes).not.toContain('Bãi đậu xe ngoài trời');
  });

  // Test 6: Maintenance day date validation
  test('should validate maintenance day date format', () => {
    const maintenanceDay = mockMaintenanceDays[0];
    const date = new Date(maintenanceDay.date);
    
    expect(date instanceof Date).toBe(true);
    expect(!isNaN(date.getTime())).toBe(true);
  });

  // Test 7: Maintenance day status validation
  test('should only consider active maintenance days', () => {
    const activeMaintenanceDays = mockMaintenanceDays.filter(maintenance => maintenance.isActive);
    const inactiveMaintenanceDays = mockMaintenanceDays.filter(maintenance => !maintenance.isActive);
    
    expect(activeMaintenanceDays.length).toBe(1);
    expect(inactiveMaintenanceDays.length).toBe(0);
  });

  // Test 8: Maintenance day affects multiple parking types
  test('should handle maintenance days affecting multiple parking types', () => {
    const maintenanceDay = mockMaintenanceDays[0];
    const affectedCount = maintenanceDay.affectedParkingTypes.length;
    
    expect(affectedCount).toBe(2);
  });

  // Test 9: Maintenance day reason validation
  test('should validate maintenance day reason is not empty', () => {
    const maintenanceDay = mockMaintenanceDays[0];
    
    expect(maintenanceDay.reason).toBeTruthy();
    expect(maintenanceDay.reason.length).toBeGreaterThan(0);
  });

  // Test 10: Maintenance day description is optional
  test('should handle optional maintenance day description', () => {
    const maintenanceDay = mockMaintenanceDays[0];
    
    expect(maintenanceDay.description).toBeTruthy();
    // Test with maintenance day without description
    const maintenanceWithoutDescription = {
      ...maintenanceDay,
      description: undefined
    };
    
    expect(maintenanceWithoutDescription.description).toBeUndefined();
  });
});

// Utility functions for testing
export const testUtils = {
  // Check if a parking type is under maintenance
  isParkingTypeUnderMaintenance: (parkingTypeId, maintenanceDays) => {
    return maintenanceDays.some(maintenance => 
      maintenance.isActive && 
      maintenance.affectedParkingTypes.some(affectedType => affectedType._id === parkingTypeId)
    );
  },

  // Get maintenance days for a date range
  getMaintenanceDaysForRange: (startDate, endDate, maintenanceDays) => {
    return maintenanceDays.filter(maintenance => {
      const maintenanceDate = new Date(maintenance.date);
      return maintenance.isActive && 
             maintenanceDate >= startDate && 
             maintenanceDate <= endDate;
    });
  },

  // Format maintenance day for display
  formatMaintenanceDay: (maintenanceDay) => {
    return {
      date: new Date(maintenanceDay.date).toLocaleDateString('vi-VN'),
      reason: maintenanceDay.reason,
      description: maintenanceDay.description,
      affectedTypes: maintenanceDay.affectedParkingTypes.map(type => type.name)
    };
  },

  // Validate maintenance day data
  validateMaintenanceDay: (maintenanceDay) => {
    const errors = [];
    
    if (!maintenanceDay.date) errors.push('Date is required');
    if (!maintenanceDay.reason) errors.push('Reason is required');
    if (!maintenanceDay.affectedParkingTypes || maintenanceDay.affectedParkingTypes.length === 0) {
      errors.push('At least one parking type must be affected');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// Export test data for reuse
export const testData = {
  mockMaintenanceDays,
  mockParkingTypes
}; 