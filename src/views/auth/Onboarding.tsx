import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Store, 
  ShoppingBag, 
  Utensils, 
  Wrench, 
  Rocket, 
  MoreHorizontal, 
  Check, 
  ArrowRight, 
  Camera, 
  Upload, 
  LayoutDashboard, 
  Sparkles,
  IndianRupee,
  DollarSign,
  Euro,
  Coins
} from 'lucide-react';
import { useAuthStore } from '../../authStore';

const BUSINESS_TYPES = [
  { id: 'Grocery Store', label: 'Grocery Store', icon: Store, desc: 'Supermarkets, kirana, provisions' },
  { id: 'Retail Shop', label: 'Retail Shop', icon: ShoppingBag, desc: 'Apparel, electronics, consumer goods' },
  { id: 'Wholesale Business', label: 'Wholesale Business', icon: Building2, desc: 'Bulk distribution & B2B trade' },
  { id: 'Cafe or Restaurant', label: 'Cafe or Restaurant', icon: Utensils, desc: 'F&B, bakeries, eateries' },
  { id: 'Hardware Store', label: 'Hardware Store', icon: Wrench, desc: 'Tools, electricals, sanitaryware' },
  { id: 'Small Startup', label: 'Small Startup', icon: Rocket, desc: 'Digital, agency, services' },
  { id: 'Other', label: 'Other', icon: MoreHorizontal, desc: 'Independent merchants & traders' },
];

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

const REPORTING_PERIODS = [
  { id: 'monthly', label: 'Monthly', desc: 'Standard calendar month insights' },
  { id: 'weekly', label: 'Weekly', desc: 'Agile 7-day purchasing cycles' },
  { id: 'quarterly', label: 'Quarterly', desc: 'Financial quarter review' },
  { id: 'annual', label: 'Annual', desc: 'Fiscal year overview' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, completeOnboarding } = useAuthStore();

  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState(user?.businessProfile?.businessType || 'Retail Shop');
  const [businessName, setBusinessName] = useState(user?.businessProfile?.businessName || '');
  const [currency, setCurrency] = useState(user?.businessProfile?.currency || 'INR');
  const [reportingPeriod, setReportingPeriod] = useState(user?.businessProfile?.reportingPeriod || 'monthly');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinish = async (targetRoute: string = '/') => {
    setIsSubmitting(true);
    await completeOnboarding({
      businessName: businessName.trim() || 'My Business',
      businessType,
      currency,
      reportingPeriod
    });
    setIsSubmitting(false);
    navigate(targetRoute, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F4FAF9] dark:bg-gray-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      
      {/* Container */}
      <div className="max-w-2xl w-full mx-auto">
        
        {/* Top Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-bold text-[#5C7A7D] dark:text-gray-400 uppercase tracking-wider mb-2">
            <span>Step {step} of 5</span>
            <span>{Math.round((step / 5) * 100)}% Completed</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#028090] to-[#02C39A] transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-teal-900/5 border border-teal-100/70 dark:border-gray-800 p-6 sm:p-10 transition-all">
          
          {/* STEP 1: Welcome & Overview */}
          {step === 1 && (
            <div className="space-y-6 text-center animate-in fade-in">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#028090] to-[#02C39A] flex items-center justify-center mx-auto shadow-lg shadow-[#028090]/25 text-white">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0B2E33] dark:text-gray-100">
                  Welcome, {user?.fullName || 'Business Owner'}!
                </h2>
                <p className="mt-2 text-sm text-[#5C7A7D] dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                  Let's set up your business profile in less than 60 seconds so BizPulse can personalize your ledger, inventory tracking, and price intelligence.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-2xl bg-[#028090] hover:bg-[#00A896] text-white font-semibold text-sm shadow-md transition-all"
                >
                  <span>Tell us about your business</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFinish('/')}
                  className="px-6 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold text-sm transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Business Type */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <span className="text-xs font-bold text-[#028090] dark:text-[#02C39A] uppercase tracking-wider">Step 2</span>
                <h2 className="text-2xl font-serif font-bold text-[#0B2E33] dark:text-gray-100 mt-1">
                  What type of business do you operate?
                </h2>
                <p className="text-sm text-[#5C7A7D] dark:text-gray-400">
                  Select the category that best matches your daily operations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {BUSINESS_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = businessType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setBusinessType(t.id)}
                      className={`flex items-start p-4 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-[#028090] bg-teal-50/60 dark:bg-[#028090]/15 dark:border-[#02C39A]'
                          : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl mr-3.5 ${
                        isSelected 
                          ? 'bg-[#028090] text-white' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm text-[#0B2E33] dark:text-gray-100 flex items-center justify-between">
                          <span>{t.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-[#028090] dark:text-[#02C39A]" />}
                        </div>
                        <div className="text-xs text-[#5C7A7D] dark:text-gray-400 mt-0.5">{t.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-between items-center border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center px-6 py-3 rounded-2xl bg-[#028090] text-white font-semibold text-sm hover:bg-[#00A896] transition-all"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Business Name */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <span className="text-xs font-bold text-[#028090] dark:text-[#02C39A] uppercase tracking-wider">Step 3</span>
                <h2 className="text-2xl font-serif font-bold text-[#0B2E33] dark:text-gray-100 mt-1">
                  What is your business name?
                </h2>
                <p className="text-sm text-[#5C7A7D] dark:text-gray-400">
                  This name will appear on your financial reports and intelligence exports.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B2E33] dark:text-gray-300 uppercase tracking-wider mb-2">
                  Trading Name / Store Name
                </label>
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Apex Traders & Supplies"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#028090] text-[#0B2E33] dark:text-gray-100 placeholder-gray-400 transition-all"
                  />
                </div>
                <p className="mt-2 text-xs text-[#5C7A7D] dark:text-gray-400">
                  Optional. If left blank, you can easily customize this anytime in your Business Profile.
                </p>
              </div>

              <div className="pt-4 flex justify-between items-center border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="inline-flex items-center px-6 py-3 rounded-2xl bg-[#028090] text-white font-semibold text-sm hover:bg-[#00A896] transition-all"
                >
                  <span>Next: Currency</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Currency & Reporting Preferences */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <span className="text-xs font-bold text-[#028090] dark:text-[#02C39A] uppercase tracking-wider">Step 4</span>
                <h2 className="text-2xl font-serif font-bold text-[#0B2E33] dark:text-gray-100 mt-1">
                  Currency and Reporting
                </h2>
                <p className="text-sm text-[#5C7A7D] dark:text-gray-400">
                  Configure default monetary units and analysis cadence.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B2E33] dark:text-gray-300 uppercase tracking-wider mb-2">
                  Operating Currency
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setCurrency(c.code)}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        currency === c.code
                          ? 'border-[#028090] bg-teal-50 dark:bg-[#028090]/20 font-bold text-[#028090] dark:text-[#02C39A]'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-[#0B2E33] dark:text-gray-300'
                      }`}
                    >
                      <div className="text-lg font-serif">{c.symbol}</div>
                      <div className="text-xs font-bold mt-0.5">{c.code}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B2E33] dark:text-gray-300 uppercase tracking-wider mb-2">
                  Preferred Reporting Period
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {REPORTING_PERIODS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setReportingPeriod(p.id as any)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        reportingPeriod === p.id
                          ? 'border-[#028090] bg-teal-50 dark:bg-[#028090]/20 text-[#028090] dark:text-[#02C39A]'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-[#0B2E33] dark:text-gray-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{p.label}</div>
                      <div className="text-[11px] text-[#5C7A7D] dark:text-gray-400 mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="inline-flex items-center px-6 py-3 rounded-2xl bg-[#028090] text-white font-semibold text-sm hover:bg-[#00A896] transition-all"
                >
                  <span>Review & Complete</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Ready to use BizPulse */}
          {step === 5 && (
            <div className="space-y-6 text-center animate-in fade-in">
              <div className="w-16 h-16 rounded-3xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-[#028090] dark:text-[#02C39A] flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0B2E33] dark:text-gray-100">
                  You're ready to use BizPulse
                </h2>
                <p className="mt-2 text-sm text-[#5C7A7D] dark:text-gray-400 max-w-md mx-auto">
                  Your workspace is configured for <span className="font-semibold text-[#0B2E33] dark:text-gray-200">{businessName || 'your business'}</span> ({businessType}). What would you like to start with?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleFinish('/scan')}
                  className="flex flex-col items-center p-5 rounded-2xl border border-teal-100 dark:border-gray-800 hover:border-[#028090] hover:bg-teal-50/40 dark:hover:bg-gray-800/60 transition-all text-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#028090]/10 dark:bg-[#028090]/20 text-[#028090] dark:text-[#02C39A] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-sm text-[#0B2E33] dark:text-gray-100 mb-1">Scan First Receipt</span>
                  <span className="text-xs text-[#5C7A7D] dark:text-gray-400">Capture purchase slip with camera</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleFinish('/scan')}
                  className="flex flex-col items-center p-5 rounded-2xl border border-teal-100 dark:border-gray-800 hover:border-[#028090] hover:bg-teal-50/40 dark:hover:bg-gray-800/60 transition-all text-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#00A896]/10 dark:bg-[#00A896]/20 text-[#00A896] dark:text-[#02C39A] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-sm text-[#0B2E33] dark:text-gray-100 mb-1">Upload Receipt</span>
                  <span className="text-xs text-[#5C7A7D] dark:text-gray-400">Upload existing invoice image</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleFinish('/')}
                  className="flex flex-col items-center p-5 rounded-2xl border border-teal-100 dark:border-gray-800 hover:border-[#028090] hover:bg-teal-50/40 dark:hover:bg-gray-800/60 transition-all text-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-gray-800 text-[#0B2E33] dark:text-gray-200 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <LayoutDashboard className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-sm text-[#0B2E33] dark:text-gray-100 mb-1">Explore Dashboard</span>
                  <span className="text-xs text-[#5C7A7D] dark:text-gray-400">Review empty workspace & metrics</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
