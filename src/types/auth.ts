export interface BusinessProfile {
  businessName: string;
  businessType: string;
  businessCategory: string;
  ownerName: string;
  businessEmail: string;
  phoneNumber?: string;
  address?: string;
  cityState?: string;
  currency: string;
  reportingPeriod: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  gstNumber?: string;
}

export interface UserAlertPreferences {
  budgetAlerts: boolean;
  priceChangeAlerts: boolean;
  lowStockAlerts: boolean;
  unusualSpendingAlerts: boolean;
  productNotifications: boolean;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  reportingPeriod: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  defaultCategory: string;
  alertPreferences: UserAlertPreferences;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  createdAt: string;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  businessProfile: BusinessProfile;
  settings: UserSettings;
}
