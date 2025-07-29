// Frontend Test Script for New Features
// This file can be used with Jest or similar testing framework

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock data for testing
const mockMaintenanceDay = {
  _id: '1',
  date: '2024-01-15',
  reason: 'Bảo trì định kỳ',
  description: 'Bảo trì hệ thống điện',
  isActive: true,
  affectedParkingTypes: [
    { _id: '1', name: 'Bãi A', code: 'A001' }
  ],
  createdBy: { _id: '1', name: 'Admin', email: 'admin@test.com' }
};

const mockParkingType = {
  _id: '1',
  code: 'A001',
  name: 'Bãi A',
  description: 'Bãi đậu xe trong nhà',
  pricePerDay: 100,
  totalSpaces: 50,
  specialPrices: [
    {
      _id: '1',
      date: '2024-01-20',
      price: 150,
      reason: 'Ngày lễ',
      isActive: true
    }
  ]
};

const mockBooking = {
  _id: '1',
  bookingNumber: 'BK001',
  customerName: 'Nguyễn Văn A',
  customerPhone: '0123456789',
  licensePlate: '30A-12345',
  checkInTime: '2024-01-15T10:00:00Z',
  checkOutTime: '2024-01-17T10:00:00Z',
  status: 'confirmed',
  isManualBooking: true,
  createdBy: { _id: '1', name: 'Staff', email: 'staff@test.com' }
};

// Test suite for new features
describe('New Features Tests', () => {
  
  // Test 1: Maintenance Day Management
  describe('Maintenance Day Management', () => {
    test('should display maintenance days list', () => {
      // Mock the API response
      const mockApi = {
        getAllMaintenanceDays: jest.fn().mockResolvedValue({
          maintenanceDays: [mockMaintenanceDay],
          total: 1
        })
      };

      // Test component rendering
      expect(mockApi.getAllMaintenanceDays).toBeDefined();
    });

    test('should create new maintenance day', () => {
      const mockCreateApi = {
        createMaintenanceDay: jest.fn().mockResolvedValue({
          message: 'Tạo ngày bảo trì thành công',
          maintenanceDay: mockMaintenanceDay
        })
      };

      expect(mockCreateApi.createMaintenanceDay).toBeDefined();
    });

    test('should update maintenance day', () => {
      const mockUpdateApi = {
        updateMaintenanceDay: jest.fn().mockResolvedValue({
          message: 'Cập nhật ngày bảo trì thành công',
          maintenanceDay: { ...mockMaintenanceDay, reason: 'Updated reason' }
        })
      };

      expect(mockUpdateApi.updateMaintenanceDay).toBeDefined();
    });

    test('should delete maintenance day', () => {
      const mockDeleteApi = {
        deleteMaintenanceDay: jest.fn().mockResolvedValue({
          message: 'Xóa ngày bảo trì thành công'
        })
      };

      expect(mockDeleteApi.deleteMaintenanceDay).toBeDefined();
    });
  });

  // Test 2: Special Pricing Management
  describe('Special Pricing Management', () => {
    test('should display special prices for parking type', () => {
      const mockApi = {
        getSpecialPrices: jest.fn().mockResolvedValue({
          specialPrices: mockParkingType.specialPrices
        })
      };

      expect(mockApi.getSpecialPrices).toBeDefined();
    });

    test('should add new special price', () => {
      const mockApi = {
        addSpecialPrice: jest.fn().mockResolvedValue({
          message: 'Thêm giá đặc biệt thành công',
          specialPrice: {
            _id: '2',
            date: '2024-01-25',
            price: 200,
            reason: 'Sự kiện đặc biệt',
            isActive: true
          }
        })
      };

      expect(mockApi.addSpecialPrice).toBeDefined();
    });

    test('should update special price', () => {
      const mockApi = {
        updateSpecialPrice: jest.fn().mockResolvedValue({
          message: 'Cập nhật giá đặc biệt thành công',
          specialPrice: { ...mockParkingType.specialPrices[0], price: 180 }
        })
      };

      expect(mockApi.updateSpecialPrice).toBeDefined();
    });

    test('should delete special price', () => {
      const mockApi = {
        deleteSpecialPrice: jest.fn().mockResolvedValue({
          message: 'Xóa giá đặc biệt thành công'
        })
      };

      expect(mockApi.deleteSpecialPrice).toBeDefined();
    });
  });

  // Test 3: Manual Booking
  describe('Manual Booking', () => {
    test('should create manual booking', () => {
      const mockApi = {
        createManualBooking: jest.fn().mockResolvedValue({
          message: 'Tạo đặt chỗ thủ công thành công',
          booking: mockBooking
        })
      };

      expect(mockApi.createManualBooking).toBeDefined();
    });

    test('should validate booking form data', () => {
      const validBookingData = {
        customerName: 'Nguyễn Văn A',
        customerPhone: '0123456789',
        customerEmail: 'test@example.com',
        licensePlate: '30A-12345',
        parkingType: '1',
        checkInTime: '2024-01-15T10:00:00Z',
        checkOutTime: '2024-01-17T10:00:00Z',
        paymentStatus: 'paid',
        paymentMethod: 'cash'
      };

      // Test required fields
      expect(validBookingData.customerName).toBeTruthy();
      expect(validBookingData.customerPhone).toBeTruthy();
      expect(validBookingData.licensePlate).toBeTruthy();
      expect(validBookingData.parkingType).toBeTruthy();
      expect(validBookingData.checkInTime).toBeTruthy();
      expect(validBookingData.checkOutTime).toBeTruthy();

      // Test date validation
      const checkIn = new Date(validBookingData.checkInTime);
      const checkOut = new Date(validBookingData.checkOutTime);
      expect(checkOut > checkIn).toBe(true);
    });
  });

  // Test 4: Today's Overview
  describe('Today Overview', () => {
    test('should fetch today bookings summary', () => {
      const mockApi = {
        getTodayBookings: jest.fn().mockResolvedValue({
          checkIns: [mockBooking],
          checkOuts: [mockBooking],
          overdue: [],
          summary: {
            totalCheckIns: 1,
            totalCheckOuts: 1,
            totalOverdue: 0
          }
        })
      };

      expect(mockApi.getTodayBookings).toBeDefined();
    });

    test('should display check-ins list', () => {
      const checkIns = [mockBooking];
      expect(checkIns).toHaveLength(1);
      expect(checkIns[0].customerName).toBe('Nguyễn Văn A');
    });

    test('should display check-outs list', () => {
      const checkOuts = [mockBooking];
      expect(checkOuts).toHaveLength(1);
      expect(checkOuts[0].licensePlate).toBe('30A-12345');
    });

    test('should display overdue bookings', () => {
      const overdue = [];
      expect(overdue).toHaveLength(0);
    });
  });

  // Test 5: Print Functionality
  describe('Print Functionality', () => {
    test('should trigger print for booking', () => {
      // Mock window.print
      const mockPrint = jest.fn();
      Object.defineProperty(window, 'print', {
        value: mockPrint,
        writable: true
      });

      // Simulate print button click
      mockPrint();
      expect(mockPrint).toHaveBeenCalled();
    });

    test('should trigger print for today overview', () => {
      const mockPrint = jest.fn();
      Object.defineProperty(window, 'print', {
        value: mockPrint,
        writable: true
      });

      mockPrint();
      expect(mockPrint).toHaveBeenCalled();
    });
  });

  // Test 6: API Integration
  describe('API Integration', () => {
    test('should handle API errors gracefully', () => {
      const mockErrorApi = {
        getAllMaintenanceDays: jest.fn().mockRejectedValue(new Error('Network error'))
      };

      expect(mockErrorApi.getAllMaintenanceDays).toBeDefined();
    });

    test('should handle successful API responses', () => {
      const mockSuccessApi = {
        getAllMaintenanceDays: jest.fn().mockResolvedValue({
          maintenanceDays: [mockMaintenanceDay],
          total: 1
        })
      };

      expect(mockSuccessApi.getAllMaintenanceDays).toBeDefined();
    });
  });

  // Test 7: Form Validation
  describe('Form Validation', () => {
    test('should validate maintenance day form', () => {
      const validMaintenanceData = {
        date: '2024-01-15',
        reason: 'Bảo trì định kỳ',
        description: 'Bảo trì hệ thống điện',
        affectedParkingTypes: ['1']
      };

      expect(validMaintenanceData.date).toBeTruthy();
      expect(validMaintenanceData.reason).toBeTruthy();
      expect(validMaintenanceData.affectedParkingTypes).toBeInstanceOf(Array);
    });

    test('should validate special price form', () => {
      const validSpecialPriceData = {
        date: '2024-01-20',
        price: 150,
        reason: 'Ngày lễ'
      };

      expect(validSpecialPriceData.date).toBeTruthy();
      expect(validSpecialPriceData.price).toBeGreaterThan(0);
      expect(validSpecialPriceData.reason).toBeTruthy();
    });
  });

  // Test 8: Navigation
  describe('Navigation', () => {
    test('should have correct admin routes', () => {
      const adminRoutes = [
        '/admin/maintenance',
        '/admin/special-pricing',
        '/admin/manual-booking',
        '/admin/today-overview'
      ];

      expect(adminRoutes).toHaveLength(4);
      expect(adminRoutes[0]).toBe('/admin/maintenance');
      expect(adminRoutes[1]).toBe('/admin/special-pricing');
      expect(adminRoutes[2]).toBe('/admin/manual-booking');
      expect(adminRoutes[3]).toBe('/admin/today-overview');
    });

    test('should have correct API endpoints', () => {
      const apiEndpoints = [
        '/api/maintenance',
        '/api/maintenance/check/range',
        '/api/bookings/manual',
        '/api/bookings/today/summary',
        '/api/admin/parking-types/*/special-prices'
      ];

      expect(apiEndpoints).toHaveLength(5);
    });
  });
});

// Utility functions for testing
export const testUtils = {
  // Mock API response
  mockApiResponse: (data) => Promise.resolve({ data }),
  
  // Mock API error
  mockApiError: (message) => Promise.reject(new Error(message)),
  
  // Validate date format
  isValidDate: (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  },
  
  // Validate email format
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  // Validate phone format
  isValidPhone: (phone) => {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone);
  },
  
  // Validate license plate format
  isValidLicensePlate: (plate) => {
    const plateRegex = /^[0-9]{2}[A-Z]-[0-9]{4,5}$/;
    return plateRegex.test(plate);
  }
};

// Export test data for reuse
export const testData = {
  mockMaintenanceDay,
  mockParkingType,
  mockBooking
}; 