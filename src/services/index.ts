// API instance
export { default as api } from './api';

// Auth services
export { login, register, getProfile, updateProfile, changePassword, getBookingTerms as authGetBookingTerms } from './auth';

// Booking services
export { 
  getBookingTerms, 
  getAvailableParkingTypes, 
  checkAvailability,
  calculatePrice, 
  createBooking,
  getBookingBySearch,
  getBookingDetails,
  updateBookingStatus
} from './booking';

// Parking services
export { 
  getAllParkingTypes, 
  getParkingTypeById, 
  getParkingTypeAvailability
} from './parking';

// Addon services
export { 
  getAllAddonServices, 
  getAddonServiceById, 
  getAddonServicesByCategory,
  createAddonService,
  updateAddonService,
  deleteAddonService,
  toggleAddonServiceStatus,
  initializeDefaultServices,
  updateServiceOrder
} from './addonServices';

// Discount code services
export { 
  getAllDiscountCodes, 
  getActiveDiscountCodes, 
  getDiscountCodeById,
  validateDiscountCode,
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
  toggleDiscountCodeStatus,
  getDiscountCodeStats
} from './discountCodes';

// Admin services
export { 
  getDashboardStats, 
  getRecentBookings,
  getBookingStats,
  getParkingTypeStats,
  getCurrentParkingStatus,
  getAllBookings, 
  updateBookingStatus as adminUpdateBookingStatus, 
  updateBooking, 
  getAllUsers, 
  updateUserVIP, 
  updateUser, 
  createParkingType as adminCreateParkingType, 
  updateParkingType as adminUpdateParkingType, 
  deleteParkingType as adminDeleteParkingType, 
  createAddonService as adminCreateAddonService, 
  updateAddonService as adminUpdateAddonService, 
  deleteAddonService as adminDeleteAddonService, 
  createDiscountCode as adminCreateDiscountCode, 
  updateDiscountCode as adminUpdateDiscountCode, 
  deleteDiscountCode as adminDeleteDiscountCode, 
  getSystemSettings as adminGetSystemSettings, 
  updateSystemSettings as adminUpdateSystemSettings, 
  createManualBooking, 
  getRevenueReport, 
  getOccupancyReport 
} from './admin';

// System settings services
export { 
  getSystemSettings, 
  updateSystemSettings, 
  getBookingTerms as getSystemBookingTerms, 
  updateBookingTerms
} from './systemSettings'; 