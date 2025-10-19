export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'staff' | 'admin';
  isVIP: boolean;
  vipDiscount: number;
  vipCode?: string;
  vipCreatedAt?: string;
  licensePlate?: string;
  address?: string;
  isActive: boolean;
  lastLogin?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParkingType {
  _id: string;
  code: string;
  name: string;
  type: 'indoor' | 'outdoor' | 'disabled';
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
  totalSpaces: number;
  availableSpaces: number;
  pricePerDay: number;
  price?: number; // Current price for selected date
  specialPrices: Array<{
    _id: string;
    date: string;
    price: number;
    reason?: string;
  }>;
  location?: string;
  features: string[];
  operatingHours: {
    open: string;
    close: string;
  };
  occupancyRate?: string;
  currentBookings?: number;
  images?: Array<{
    _id: string;
    url: string;
    thumbnailUrl?: string;
    cloudinaryId: string;
    thumbnailCloudinaryId?: string;
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
    uploadedAt: string;
    isActive: boolean;
  }>;
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
  bookingNumber?: string;
  user: User;
  parkingType: ParkingType;
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
  departureTerminal?: string;
  returnTerminal?: string;
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
  dailyPrices?: Array<{
    date: string; // ISO date (YYYY-MM-DD)
    price: number;
    isSpecialPrice: boolean;
    specialPriceReason?: string;
    isMaintenanceDay: boolean;
  }>;
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
  minBookingDays: number;
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
  luggageSettings: {
    freeLuggageCount: number;
    luggagePricePerItem: number;
  };
  maintenanceMode: {
    enabled: boolean;
    message: string;
  };

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
  agreedToTerms: boolean;
  parkingTypeId: string;
  checkInTime: string;
  checkOutTime: string;
  selectedAddonServices: string[];
  discountCode: string;
  driverName: string;
  phone: string;
  email: string;
  licensePlate: string;
  passengerCount: number;
  luggageCount: number;
  termsAccepted: boolean;
  departureTerminal?: string;
  returnTerminal?: string;
}

export interface PriceCalculation {
  pricePerDay: number;
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

export interface ParkingTypeStats {
  _id: string;
  name: string;
  type: string;
  totalSpaces: number;
  availableSpaces: number;
  occupancyRate: number;
  currentBookings: number;
  pricePerDay: number;
}

export interface CurrentParkingStatus {
  parkedVehicles: Booking[];
  arrivingToday: Booking[];
  leavingToday: Booking[];
} 