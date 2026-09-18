import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  User, 
  Building2, 
  Settings, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Download, 
  Save, 
  X, 
  Edit2, 
  KeyRound, 
  Moon, 
  Sun, 
  Monitor, 
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { useAuthStore } from '../../authStore';
import { useStore } from '../../store';
import { cn } from '../../lib/utils';

export default function Account() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const { 
    user, 
    token,
    logout, 
    updateProfile, 
    updateBusinessProfile, 
    updateSettings, 
    changePassword, 
    deleteAccount 
  } = useAuthStore();

  const { theme, setTheme, switchUserContext } = useStore();

  // User Profile Edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Business Profile Edit state
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [businessName, setBusinessName] = useState(user?.businessProfile?.businessName || '');
  const [businessType, setBusinessType] = useState(user?.businessProfile?.businessType || 'Retail Shop');
  const [businessCategory, setBusinessCategory] = useState(user?.businessProfile?.businessCategory || '');
  const [ownerName, setOwnerName] = useState(user?.businessProfile?.ownerName || '');
  const [businessEmail, setBusinessEmail] = useState(user?.businessProfile?.businessEmail || '');
  const [businessPhone, setBusinessPhone] = useState(user?.businessProfile?.phoneNumber || '');
  const [businessAddress, setBusinessAddress] = useState(user?.businessProfile?.address || '');
  const [cityState, setCityState] = useState(user?.businessProfile?.cityState || '');
  const [currency, setCurrency] = useState(user?.businessProfile?.currency || 'INR');
  const [reportingPeriod, setReportingPeriod] = useState(user?.businessProfile?.reportingPeriod || 'monthly');
  const [gstNumber, setGstNumber] = useState(user?.businessProfile?.gstNumber || '');
  const [businessMsg, setBusinessMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Change Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Delete Account Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePass, setDeletePass] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync state with user data
  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setPhoneNumber(user.phoneNumber || '');
      if (user.businessProfile) {
        setBusinessName(user.businessProfile.businessName);
        setBusinessType(user.businessProfile.businessType);
        setBusinessCategory(user.businessProfile.businessCategory);
        setOwnerName(user.businessProfile.ownerName);
        setBusinessEmail(user.businessProfile.businessEmail);
        setBusinessPhone(user.businessProfile.phoneNumber || '');
        setBusinessAddress(user.businessProfile.address || '');
        setCityState(user.businessProfile.cityState || '');
        setCurrency(user.businessProfile.currency || 'INR');
        setReportingPeriod(user.businessProfile.reportingPeriod || 'monthly');
        setGstNumber(user.businessProfile.gstNumber || '');
      }
    }
  }, [user]);

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    const res = await updateProfile({ fullName, phoneNumber });
    if (res.success) {
      setProfileMsg({ type: 'success', text: 'Personal profile updated.' });
      setIsEditingProfile(false);
    } else {
      setProfileMsg({ type: 'error', text: res.error || 'Failed to update profile.' });
    }
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusinessMsg(null);
    const res = await updateBusinessProfile({
      businessName,
      businessType,
      businessCategory,
      ownerName,
      businessEmail,
      phoneNumber: businessPhone,
      address: businessAddress,
      cityState,
      currency,
      reportingPeriod: reportingPeriod as any,
      gstNumber
    });
    if (res.success) {
      setBusinessMsg({ type: 'success', text: 'Business profile updated.' });
      setIsEditingBusiness(false);
    } else {
      setBusinessMsg({ type: 'error', text: res.error || 'Failed to update business profile.' });
    }
  };

  const handleAlertToggle = async (key: keyof typeof user.settings.alertPreferences) => {
    if (!user) return;
    const currentAlerts = user.settings.alertPreferences || {
      budgetAlerts: true,
      priceChangeAlerts: true,
      lowStockAlerts: true,
      unusualSpendingAlerts: true,
      productNotifications: false
    };
    await updateSettings({
      alertPreferences: {
        ...currentAlerts,
        [key]: !currentAlerts[key]
      }
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    setIsSavingPassword(true);
    const res = await changePassword({ currentPassword, newPassword, confirmPassword });
    setIsSavingPassword(false);
    if (res.success) {
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordMsg(null);
      }, 1500);
    } else {
      setPasswordMsg({ type: 'error', text: res.error || 'Failed to change password.' });
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    setIsDeleting(true);
    const res = await deleteAccount(deletePass);
    setIsDeleting(false);
    if (res.success) {
      await switchUserContext(null);
      navigate('/login', { replace: true });
    } else {
      setDeleteError(res.error || 'Failed to delete account.');
    }
  };

  const handleLogout = async () => {
    await logout();
    await switchUserContext(null);
    navigate('/login', { replace: true });
  };

  const handleExportData = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/export-data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bizpulse-backup-${user?.id || 'export'}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert('Failed to export data.');
    }
  };

  const initials = (user?.fullName || 'BP')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-full bg-[#F4FAF9] dark:bg-gray-950 pb-8 md:pb-10 text-[#0B2E33] dark:text-gray-100 transition-colors duration-300">
      
      {/* Header Banner */}
      <div className="bg-[#0B2E33] text-white pt-8 pb-12 px-6 sm:px-10 rounded-b-[40px] shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5 blur-3xl pointer-events-none"></div>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#028090] to-[#02C39A] text-white font-bold text-xl flex items-center justify-center shadow-lg">
              {initials}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-serif font-bold text-white">{user?.fullName || 'Business Owner'}</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#02C39A]/20 text-[#02C39A] border border-[#02C39A]/30">
                  Verified
                </span>
              </div>
              <p className="text-xs text-teal-200/80 mt-0.5">
                {user?.businessProfile?.businessName || 'Business Profile'} • {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-all border border-white/10"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Body with Tabbed Layout */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-teal-900/5 border border-teal-100/60 dark:border-gray-800 overflow-hidden flex flex-col md:flex-row">
          
          {/* Tabs Navigation Sidebar */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 p-3 sm:p-4 shrink-0 flex md:flex-col overflow-x-auto scrollbar-hide space-x-2 md:space-x-0 md:space-y-1 bg-gray-50/40 dark:bg-gray-900/40">
            {[
              { id: 'profile', label: 'User Profile', icon: User },
              { id: 'business', label: 'Business Profile', icon: Building2 },
              { id: 'settings', label: 'Account Settings', icon: Settings },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'privacy', label: 'Privacy & Security', icon: Shield },
              { id: 'help', label: 'Help & Support', icon: HelpCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTab(tab.id)}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all',
                    isActive
                      ? 'bg-[#028090] text-white shadow-md'
                      : 'text-[#5C7A7D] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0B2E33] dark:hover:text-gray-100'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 p-6 sm:p-8 min-h-[480px]">
            
            {/* 1. USER PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <h2 className="text-xl font-bold text-[#0B2E33] dark:text-gray-100">Personal Information</h2>
                    <p className="text-xs text-[#5C7A7D] dark:text-gray-400 mt-0.5">Manage your authenticated credentials and contact details.</p>
                  </div>
                  {!isEditingProfile ? (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-teal-200 dark:border-gray-700 text-[#028090] dark:text-[#02C39A] text-xs font-semibold hover:bg-teal-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>

                {profileMsg && (
                  <div className={cn(
                    'p-3.5 rounded-2xl text-xs font-medium flex items-center space-x-2',
                    profileMsg.type === 'success' ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200' : 'bg-rose-50 text-rose-800'
                  )}>
                    {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{profileMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingProfile}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 disabled:opacity-75 text-sm font-medium text-[#0B2E33] dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Account Email Address
                      </label>
                      <input
                        type="email"
                        disabled
                        value={user?.email || ''}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-500 cursor-not-allowed"
                      />
                      <span className="text-[11px] text-[#5C7A7D] dark:text-gray-400 mt-1 block">Email changes require security re-verification.</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        disabled={!isEditingProfile}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 disabled:opacity-75 text-sm font-medium text-[#0B2E33] dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Member Since
                      </label>
                      <div className="px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/30 text-sm text-gray-600 dark:text-gray-300">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recent'}
                      </div>
                    </div>
                  </div>

                  {isEditingProfile && (
                    <div className="pt-3">
                      <button
                        type="submit"
                        className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-[#028090] text-white font-semibold text-xs shadow hover:bg-[#00A896] transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Profile Changes</span>
                      </button>
                    </div>
                  )}
                </form>

                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#0B2E33] dark:text-gray-100">Security Password</h3>
                    <p className="text-xs text-[#5C7A7D] dark:text-gray-400">Regularly update your credentials to keep merchant data secure.</p>
                  </div>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold text-[#0B2E33] dark:text-gray-200 transition-colors"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Change Password</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. BUSINESS PROFILE TAB */}
            {activeTab === 'business' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <h2 className="text-xl font-bold text-[#0B2E33] dark:text-gray-100">Business Profile</h2>
                    <p className="text-xs text-[#5C7A7D] dark:text-gray-400 mt-0.5">Details used in generated reports, invoices, and AI purchase summaries.</p>
                  </div>
                  {!isEditingBusiness ? (
                    <button
                      onClick={() => setIsEditingBusiness(true)}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-teal-200 dark:border-gray-700 text-[#028090] dark:text-[#02C39A] text-xs font-semibold hover:bg-teal-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Business Info</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditingBusiness(false)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>

                {businessMsg && (
                  <div className={cn(
                    'p-3.5 rounded-2xl text-xs font-medium flex items-center space-x-2',
                    businessMsg.type === 'success' ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200' : 'bg-rose-50 text-rose-800'
                  )}>
                    {businessMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{businessMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleSaveBusiness} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Trading / Business Name
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingBusiness}
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 disabled:opacity-75 text-sm font-medium text-[#0B2E33] dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Business Type
                      </label>
                      <select
                        disabled={!isEditingBusiness}
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 disabled:opacity-75 text-sm font-medium text-[#0B2E33] dark:text-gray-100"
                      >
                        <option value="Grocery Store">Grocery Store</option>
                        <option value="Retail Shop">Retail Shop</option>
                        <option value="Wholesale Business">Wholesale Business</option>
                        <option value="Cafe or Restaurant">Cafe or Restaurant</option>
                        <option value="Hardware Store">Hardware Store</option>
                        <option value="Small Startup">Small Startup</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Business Category
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingBusiness}
                        value={businessCategory}
                        onChange={(e) => setBusinessCategory(e.target.value)}
                        placeholder="e.g. FMCG, Textiles, Electronics"
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 disabled:opacity-75 text-sm font-medium text-[#0B2E33] dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Owner / Director Name
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingBusiness}
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 disabled:opacity-75 text-sm font-medium text-[#0B2E33] dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Business Contact Email
                      </label>
                      <input
                        type="email"
                        disabled={!isEditingBusiness}
                        value={businessEmail}
                        onChange={(e) => setBusinessEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 disabled:opacity-75 text-sm font-medium text-[#0B2E33] dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Business Phone Number
                      </label>
                      <input
                        type="tel"
                        disabled={!isEditingBusiness}
                        value={businessPhone}
                        onChange={(e) => setBusinessPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 disabled:opacity-75 text-sm font-medium text-[#0B2E33] dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Street Address (Optional)
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingBusiness}
                        value={businessAddress}
                        onChange={(e) => setBusinessAddress(e.target.value)}
                        placeholder="Shop 14, Commercial Market"
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 disabled:opacity-75 text-sm font-medium text-[#0B2E33] dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        City & State (Optional)
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingBusiness}
                        value={cityState}
                        onChange={(e) => setCityState(e.target.value)}
                        placeholder="Ahmedabad, Gujarat"
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 disabled:opacity-75 text-sm font-medium text-[#0B2E33] dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Operating Currency
                      </label>
                      <select
                        disabled={!isEditingBusiness}
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 disabled:opacity-75 text-sm font-medium text-[#0B2E33] dark:text-gray-100"
                      >
                        <option value="INR">INR (₹) - Indian Rupee</option>
                        <option value="USD">USD ($) - US Dollar</option>
                        <option value="EUR">EUR (€) - Euro</option>
                        <option value="GBP">GBP (£) - British Pound</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        GST / Tax Number (Optional)
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingBusiness}
                        value={gstNumber}
                        onChange={(e) => setGstNumber(e.target.value)}
                        placeholder="24AAAAA0000A1Z5"
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 disabled:opacity-75 text-sm font-medium text-[#0B2E33] dark:text-gray-100"
                      />
                    </div>
                  </div>

                  {isEditingBusiness && (
                    <div className="pt-3">
                      <button
                        type="submit"
                        className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-[#028090] text-white font-semibold text-xs shadow hover:bg-[#00A896] transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Business Profile</span>
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* 3. ACCOUNT SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="text-xl font-bold text-[#0B2E33] dark:text-gray-100">Account Settings & Preferences</h2>
                  <p className="text-xs text-[#5C7A7D] dark:text-gray-400 mt-0.5">Customize UI display, session tokens, and business data backups.</p>
                </div>

                {/* Appearance Section */}
                <div>
                  <h3 className="text-xs font-bold text-[#028090] dark:text-[#02C39A] uppercase tracking-wider mb-3">
                    Appearance
                  </h3>
                  <div className="grid grid-cols-2 gap-3 max-w-sm">
                    <button
                      onClick={() => setTheme('light')}
                      className={cn(
                        'flex items-center justify-center space-x-2 p-3.5 rounded-2xl border text-xs font-semibold transition-all',
                        theme === 'light'
                          ? 'border-[#028090] bg-teal-50 text-[#028090] font-bold shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                      )}
                    >
                      <Sun className="w-4 h-4" />
                      <span>Light Mode</span>
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={cn(
                        'flex items-center justify-center space-x-2 p-3.5 rounded-2xl border text-xs font-semibold transition-all',
                        theme === 'dark'
                          ? 'border-[#028090] bg-gray-800 text-[#02C39A] font-bold shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                      )}
                    >
                      <Moon className="w-4 h-4" />
                      <span>Dark Mode</span>
                    </button>
                  </div>
                </div>

                {/* Data Management Section */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <h3 className="text-xs font-bold text-[#028090] dark:text-[#02C39A] uppercase tracking-wider mb-3">
                    Data Management & Privacy
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                      <div>
                        <div className="text-xs font-bold text-[#0B2E33] dark:text-gray-100">Export All Business Data</div>
                        <div className="text-[11px] text-[#5C7A7D] dark:text-gray-400">Download complete ledger, inventory adjustments, and budgets as JSON.</div>
                      </div>
                      <button
                        onClick={handleExportData}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#028090] text-white text-xs font-semibold hover:bg-[#00A896] transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export JSON</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                      <div>
                        <div className="text-xs font-bold text-[#0B2E33] dark:text-gray-100">Active Session Status</div>
                        <div className="text-[11px] text-[#5C7A7D] dark:text-gray-400">Isolated token-authenticated session active for 7 days.</div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200">
                        Secure Token
                      </span>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="pt-6 border-t border-rose-100 dark:border-rose-950/50">
                  <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">
                    Danger Zone
                  </h3>
                  <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-rose-900 dark:text-rose-200">Permanent Account Deletion</div>
                      <div className="text-[11px] text-rose-700/80 dark:text-rose-300/70">Wipe all receipts, stock adjustments, budgets, and user credentials permanently.</div>
                    </div>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Account</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="text-xl font-bold text-[#0B2E33] dark:text-gray-100">Smart Alert Preferences</h2>
                  <p className="text-xs text-[#5C7A7D] dark:text-gray-400 mt-0.5">Control which automated intelligence signals appear across your dashboard and ledger.</p>
                </div>

                {/* Distinction notice */}
                <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-gray-800/60 border border-teal-100 dark:border-gray-700 text-xs text-[#0B2E33] dark:text-gray-200 flex items-start space-x-3">
                  <Info className="w-4 h-4 text-[#028090] dark:text-[#02C39A] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">In-App Intelligence vs. Web Push:</span> These settings control real-time algorithmic alert badges on your BizPulse Dashboard and Ledger. Push notifications to mobile/desktop OS require native service workers which are currently offline-ready.
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      key: 'budgetAlerts' as const,
                      label: 'Budget Overspending Warnings',
                      desc: 'Trigger warnings when category spending exceeds 80% or 100% of defined budget allocations.'
                    },
                    {
                      key: 'priceChangeAlerts' as const,
                      label: 'Verified Price Change Alerts',
                      desc: 'Highlight supplier price spikes and inflation trends across identical SKU purchase items.'
                    },
                    {
                      key: 'lowStockAlerts' as const,
                      label: 'Low Estimated-Stock Warnings',
                      desc: 'Notify when estimated inventory quantities fall below merchant-defined reorder thresholds.'
                    },
                    {
                      key: 'unusualSpendingAlerts' as const,
                      label: 'Unusual Expense Outlier Alerts',
                      desc: 'Detect statistical anomalies in invoice totals compared to previous merchant history.'
                    },
                    {
                      key: 'productNotifications' as const,
                      label: 'Product Announcements & Intelligence Updates',
                      desc: 'Receive in-app feature highlights and improvements to BizPulse receipt parsing models.'
                    }
                  ].map((item) => {
                    const prefs = user?.settings?.alertPreferences || {
                      budgetAlerts: true,
                      priceChangeAlerts: true,
                      lowStockAlerts: true,
                      unusualSpendingAlerts: true,
                      productNotifications: false
                    };
                    const isChecked = !!prefs[item.key];
                    return (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900 hover:border-gray-200 transition-colors"
                      >
                        <div className="pr-4">
                          <div className="text-xs font-bold text-[#0B2E33] dark:text-gray-100">{item.label}</div>
                          <div className="text-[11px] text-[#5C7A7D] dark:text-gray-400 mt-0.5">{item.desc}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAlertToggle(item.key)}
                          className={cn(
                            'w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0',
                            isChecked ? 'bg-[#028090]' : 'bg-gray-300 dark:bg-gray-700'
                          )}
                        >
                          <div
                            className={cn(
                              'bg-white w-4 h-4 rounded-full shadow-md transform transition-transform',
                              isChecked ? 'translate-x-5' : 'translate-x-0'
                            )}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. PRIVACY & SECURITY TAB */}
            {activeTab === 'privacy' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="text-xl font-bold text-[#0B2E33] dark:text-gray-100">Privacy & Security Transparency</h2>
                  <p className="text-xs text-[#5C7A7D] dark:text-gray-400 mt-0.5">Clear disclosure of data handling, AI processing, and cryptographic protections.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 text-xs text-[#5C7A7D] dark:text-gray-300 leading-relaxed">
                  
                  <div className="p-4 rounded-2xl border border-teal-100 dark:border-gray-800 bg-teal-50/30 dark:bg-gray-800/40">
                    <h3 className="font-bold text-[#0B2E33] dark:text-gray-100 text-sm mb-1">What data BizPulse collects</h3>
                    <p>We process only merchant-provided receipts (items, quantities, totals, dates, and vendor names) and user-defined stock adjustments. We do not collect credit card numbers, personal bank logins, or confidential customer identifiers.</p>
                  </div>

                  <div className="p-4 rounded-2xl border border-teal-100 dark:border-gray-800 bg-teal-50/30 dark:bg-gray-800/40">
                    <h3 className="font-bold text-[#0B2E33] dark:text-gray-100 text-sm mb-1">Receipt Information & Gemini AI Processing</h3>
                    <p>When you scan or upload a receipt, the image is passed securely via server-side API proxy to Google Gemini 2.5 Flash for OCR text extraction. The raw image is processed in memory to produce structured JSON and is not sold or repurposed for public model training.</p>
                  </div>

                  <div className="p-4 rounded-2xl border border-teal-100 dark:border-gray-800 bg-teal-50/30 dark:bg-gray-800/40">
                    <h3 className="font-bold text-[#0B2E33] dark:text-gray-100 text-sm mb-1">User Data Isolation</h3>
                    <p>Every account is partitioned by a unique merchant identifier (`userId`). User A cannot access or view User B's purchase history, budgets, price lists, or supplier analytics. AI Chat requests are authenticated via secure bearer tokens and receive only the authenticated merchant's data.</p>
                  </div>

                  <div className="p-4 rounded-2xl border border-teal-100 dark:border-gray-800 bg-teal-50/30 dark:bg-gray-800/40">
                    <h3 className="font-bold text-[#0B2E33] dark:text-gray-100 text-sm mb-1">No Plaintext Passwords</h3>
                    <p>Passwords are never stored in plaintext. They are salted with 128-bit cryptographically secure salts and derived via the standard Node.js Scrypt key-derivation function with constant-time comparison.</p>
                  </div>

                  <div className="p-4 rounded-2xl border border-teal-100 dark:border-gray-800 bg-teal-50/30 dark:bg-gray-800/40">
                    <h3 className="font-bold text-[#0B2E33] dark:text-gray-100 text-sm mb-1">Your Right to Erasure</h3>
                    <p>You may export your data at any time in machine-readable JSON format, or permanently delete your account and associated receipts directly from the Account Settings tab.</p>
                  </div>

                </div>
              </div>
            )}

            {/* 6. HELP & SUPPORT TAB */}
            {activeTab === 'help' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="text-xl font-bold text-[#0B2E33] dark:text-gray-100">Help & Support</h2>
                  <p className="text-xs text-[#5C7A7D] dark:text-gray-400 mt-0.5">Frequently asked questions and guides for operating BizPulse.</p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      q: 'How does receipt scanning work?',
                      a: 'Point your camera at a purchase slip or upload an image. BizPulse uses Gemini 2.5 to extract line items, prices, and vendor info into an interactive draft for your review before confirming it to the ledger.'
                    },
                    {
                      q: 'Can I edit receipt items before saving?',
                      a: 'Yes. Every scanned receipt presents an interactive review screen where you can adjust item names, correct quantities, set tax categories, or add missing lines before clicking "Confirm to Ledger".'
                    },
                    {
                      q: 'How does stock level estimation work?',
                      a: 'Confirmed receipts automatically add purchased quantities to your inventory. You can record manual stock removals or write-downs from the Inventory screen at any time.'
                    },
                    {
                      q: 'How are price intelligence metrics calculated?',
                      a: 'BizPulse tracks identical normalized SKU names across different suppliers and dates, plotting cost trends and pinpointing lower-cost vendors for your regular stock.'
                    }
                  ].map((faq, i) => (
                    <div key={i} className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-900/60">
                      <div className="font-bold text-xs text-[#0B2E33] dark:text-gray-100 mb-1">{faq.q}</div>
                      <div className="text-xs text-[#5C7A7D] dark:text-gray-400 leading-relaxed">{faq.a}</div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-[#5C7A7D] dark:text-gray-400">
                  <div className="font-bold text-[#0B2E33] dark:text-gray-200 mb-1">About BizPulse</div>
                  <p>BizPulse is an AI-Powered Business Intelligence Platform designed for merchants and enterprise store owners. Version 1.0 (Production Build).</p>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-4">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-[#028090]" />
                <h3 className="font-bold text-base text-[#0B2E33] dark:text-gray-100">Change Password</h3>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordMsg && (
              <div className={cn(
                'p-3 rounded-xl text-xs font-medium mb-4 flex items-center space-x-2',
                passwordMsg.type === 'success' ? 'bg-teal-50 text-teal-800' : 'bg-rose-50 text-rose-800'
              )}>
                {passwordMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  New Password (8+ chars)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="px-5 py-2.5 rounded-xl bg-[#028090] text-white text-xs font-semibold hover:bg-[#00A896]"
                >
                  {isSavingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-rose-200 dark:border-rose-900 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-lg text-[#0B2E33] dark:text-gray-100 mb-1">Delete your account?</h3>
            <p className="text-xs text-[#5C7A7D] dark:text-gray-400 mb-4 leading-relaxed">
              This action permanently wipes your business profile, receipt records, inventory adjustments, and budgets. This cannot be undone.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-medium mb-4 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Enter Password to Confirm
                </label>
                <input
                  type="password"
                  value={deletePass}
                  onChange={(e) => setDeletePass(e.target.value)}
                  placeholder="Your account password"
                  className="w-full px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/30 dark:bg-gray-800 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePass('');
                    setDeleteError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!deletePass || isDeleting}
                  onClick={handleDeleteAccount}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
