// Auth services
export { login, register, getProfile, updateProfile, changePassword, getBookingTerms as authGetBookingTerms } from './auth';

// Booking services
export { 
  getBookingTerms, 
  getAvailableParkingLots, 
  calculatePrice, 
  createBooking,
  getBookingBySearch,
  getBookingDetails,
  updateBookingStatus,
  getMyBookings,
  cancelBooking
} from './booking';

// Parking services
export { 
  getParkingLots, 
  getParkingLotById, 
  getParkingLotsByType,
  createParkingLot,
  updateParkingLot,
  deleteParkingLot
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
  getParkingLotStats,
  getCurrentParkingStatus,
  getAllBookings, 
  updateBookingStatus as adminUpdateBookingStatus, 
  updateBooking, 
  getAllUsers, 
  updateUserVIP, 
  updateUser, 
  createParkingLot as adminCreateParkingLot, 
  updateParkingLot as adminUpdateParkingLot, 
  deleteParkingLot as adminDeleteParkingLot, 
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
  updateBookingTerms, 
  getParkingLotTypes, 
  updateParkingLotTypes 
} from './systemSettings'; 