export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'staff' | 'admin';
  isVIP: boolean;
  vipDiscount: number;
  licensePlate?: string;
  address?: string;
  isActive: boolean;
  lastLogin?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParkingLot {
  _id: string;
  name: string;
  type: 'indoor' | 'outdoor' | 'disabled';
  totalSpaces: number;
  availableSpaces: number;
  basePrice: number;
  pricePerDay: number;
  price?: number; // Current price for selected date
  specialPrices: Array<{
    _id: string;
    date: string;
    price: number;
    reason?: string;
  }>;
  description?: string;
  location?: string;
  isActive: boolean;
  features: string[];
  operatingHours: {
    open: string;
    close: string;
  };
  occupancyRate?: string;
  currentBookings?: number;
}

export interface AddonService {
  _id: string;
  name: string;
  description?: string;
  icon: string;
  price: number;
  category: 'transport' | 'cleaning' | 'security' | 'convenience' | 'other';
  isActive: boolean;
  isFree: boolean;
  requiresAdvanceBooking: boolean;
  advanceBookingHours: number;
  maxQuantity: number;
  availability: {
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
  };
  terms?: string;
  sortOrder: number;
  displayPrice: number;
}

export interface Booking {
  _id: string;
  user: User;
  parkingLot: ParkingLot;
  licensePlate: string;
  driverName: string;
  phone: string;
  email: string;
  checkInTime: string;
  checkOutTime: string;
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  addonServices: Array<{
    service: AddonService;
    name: string;
    price: number;
    icon: string;
  }>;
  discountCode?: {
    code: string;
    discountValue: number;
    discountType: 'percentage' | 'fixed';
    discountAmount: number;
  };
  luggageCount: number;
  passengerCount: number;
  estimatedArrivalTime?: string;
  flightNumber?: string;
  notes?: string;
  isVIP: boolean;
  vipDiscount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod: 'cash' | 'credit_card' | 'online';
  actualCheckInTime?: string;
  actualCheckOutTime?: string;
  createdBy?: User;
  isManualBooking: boolean;
  durationDays?: number;
  isOverdue?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountCode {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  validFrom: string;
  validTo: string;
  maxUsage?: number;
  currentUsage: number;
  isActive: boolean;
  description?: string;
  minimumAmount?: number;
  usageHistory?: Array<{
    user: string;
    booking: string;
    discountAmount: number;
    usedAt: string;
  }>;
}

export interface SystemSettings {
  _id: string;
  bookingTerms: string;
  bookingRules: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
    website: string;
  };
  businessHours: {
    open: string;
    close: string;
    is24Hours: boolean;
  };
  defaultVIPDiscount: number;
  bookingAdvanceHours: number;
  maxBookingDays: number;
  autoCancelMinutes: number;
  timeSlotInterval: number;
  notificationSettings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    reminderHours: number;
    confirmationEmail: boolean;
    reminderEmail: boolean;
  };
  paymentSettings: {
    acceptCash: boolean;
    acceptCreditCard: boolean;
    acceptOnlinePayment: boolean;
    currency: string;
    taxRate: number;
  };
  maintenanceMode: {
    enabled: boolean;
    message: string;
  };
  parkingLotTypes: Array<{
    type: 'indoor' | 'outdoor' | 'disabled';
    name: string;
    icon: string;
    description?: string;
    isActive: boolean;
  }>;
  defaultParkingLotTypes: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  licensePlate?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface BookingFormData {
  parkingLotId: string;
  selectedParkingType?: string;
  checkInTime: string;
  checkOutTime: string;
  addonServices?: string[];
  discountCode?: string;
  driverName: string;
  phone: string;
  email: string;
  licensePlate: string;
  luggageCount: number;
  passengerCount: number;
  estimatedArrivalTime?: string;
  flightNumber?: string;
  notes?: string;
  termsAccepted: boolean;
  // Additional fields for the booking form
  agreedToTerms: boolean;
  selectedAddonServices: string[];
}

export interface PriceCalculation {
  basePrice: number;
  durationDays: number;
  daysToCharge: number;
  totalBasePrice: number;
  addonTotal: number;
  addonDetails: Array<{
    service: string;
    name: string;
    price: number;
    icon: string;
  }>;
  totalAmount: number;
  discountAmount: number;
  vipDiscount: number;
  finalDiscount: number;
  finalAmount: number;
  discountCodeInfo?: {
    code: string;
    discountValue: number;
    discountType: 'percentage' | 'fixed';
  };
  currency: string;
}

export interface DashboardStats {
  todayBookings: number;
  todayRevenue: number;
  totalSpaces: number;
  availableSpaces: number;
  parkedVehicles: number;
  leavingToday: number;
  recentBookings: Booking[];
}

export interface BookingStats {
  period: string;
  totalBookings: number;
  totalRevenue: number;
  averageRevenue: number;
  statusStats: Record<string, number>;
  dailyStats: Array<{
    date: string;
    bookings: number;
    revenue: number;
  }>;
}

export interface ParkingLotStats {
  _id: string;
  name: string;
  type: string;
  totalSpaces: number;
  availableSpaces: number;
  occupancyRate: number;
  currentBookings: number;
  basePrice: number;
  pricePerDay: number;
}

export interface CurrentParkingStatus {
  parkedVehicles: Booking[];
  arrivingToday: Booking[];
  leavingToday: Booking[];
} 