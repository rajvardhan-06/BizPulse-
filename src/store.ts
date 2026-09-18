import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ReceiptStatus = 'draft' | 'confirmed' | 'deleted';

export interface ReceiptItem {
  id: string;
  name: string;
  qty: number;
  unit_price: number;
  category: string;
  unit?: string | null;
}

export interface Receipt {
  id: string;
  merchant: string;
  supplierId?: string | null;
  date: string | null;
  items: ReceiptItem[];
  total: number | null;
  currency: string;
  captureTimestamp: number;
  confirmed: boolean;
  status?: ReceiptStatus;
}

export function isConfirmedReceipt(receipt: Receipt): boolean {
  return receipt.confirmed && receipt.status !== 'deleted';
}

export interface InventoryAdjustment {
  id: string;
  normalizedName: string;
  amount: number; // Positive for add, negative for remove
  date: string;
  reason?: string;
  isSetOperation?: boolean; // If true, amount represents the exact target stock level at that moment
}

export interface InventorySettings {
  reorderThreshold?: number;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  currency: string;
  period: 'weekly' | 'monthly' | 'custom';
  startDate: string;
  endDate: string;
  category?: string;
  alertThreshold?: number;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  normalizedName: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface VirtualCard {
  id: string;
  cardholderName: string;
  cardNumber: string; // e.g. '•••• •••• 2600'
  expiry: string; // '11/24'
  balance: number;
  currency: string;
  theme: 'blue' | 'cyan' | 'dark' | 'purple';
  type: 'visa' | 'mastercard';
}

export interface PayeeContact {
  id: string;
  name: string;
  phone: string;
  avatarColor: string;
  recentAmount?: number;
}

export interface WalletTransaction {
  id: string;
  title: string;
  category: 'income' | 'electricity' | 'water' | 'internet' | 'food' | 'grocery' | 'equipment' | 'transfer' | 'receipt' | 'other';
  date: string;
  amount: number; // positive for income (+), negative for expense (-)
  currency: string;
  status: 'completed' | 'pending';
  iconType: string;
  recipient?: string;
  note?: string;
}

interface AppState {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  activeUserId: string | null;
  receipts: Receipt[];
  inventoryAdjustments: InventoryAdjustment[];
  inventorySettings: Record<string, InventorySettings>; // Keyed by normalizedName
  budgets: Budget[];
  suppliers: Supplier[];

  // Virtual Wallet & Fintech Cards (Image 2)
  cards: VirtualCard[];
  activeCardId: string;
  payees: PayeeContact[];
  walletTransactions: WalletTransaction[];
  
  switchUserContext: (userId: string | null, token?: string | null) => Promise<void>;
  syncToServer: (token: string) => Promise<void>;

  addReceipt: (receipt: Receipt) => void;
  updateReceipt: (id: string, updates: Partial<Receipt>) => void;
  deleteReceipt: (id: string) => void;
  clearLedger: () => void;

  addInventoryAdjustment: (adjustment: InventoryAdjustment) => void;
  updateInventorySettings: (normalizedName: string, settings: Partial<InventorySettings>) => void;

  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  loadSampleData: () => void;

  // Fintech Wallet Methods
  sendTransfer: (payeeName: string, amount: number, note?: string) => void;
  payBill: (title: string, category: 'electricity' | 'water' | 'internet' | 'other', amount: number) => void;
  topUp: (amount: number) => void;
  setActiveCard: (cardId: string) => void;
  addCard: (card: VirtualCard) => void;
}

function saveUserLocalData(userId: string, data: {
  receipts: Receipt[];
  inventoryAdjustments: InventoryAdjustment[];
  inventorySettings: Record<string, InventorySettings>;
  budgets: Budget[];
  suppliers: Supplier[];
}) {
  try {
    localStorage.setItem(`bizpulse_data_${userId}`, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save user local data:', err);
  }
}

function loadUserLocalData(userId: string) {
  try {
    const raw = localStorage.getItem(`bizpulse_data_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

const DEFAULT_CARDS: VirtualCard[] = [
  {
    id: 'card_primary',
    cardholderName: 'Arya Wijaya',
    cardNumber: '•••• •••• 2600',
    expiry: '11/24',
    balance: 1200.82,
    currency: 'INR',
    theme: 'blue',
    type: 'visa'
  },
  {
    id: 'card_secondary',
    cardholderName: 'Arya Wijaya',
    cardNumber: '•••• •••• 8841',
    expiry: '08/27',
    balance: 4320.50,
    currency: 'INR',
    theme: 'cyan',
    type: 'mastercard'
  }
];

const DEFAULT_PAYEES: PayeeContact[] = [
  { id: 'p_1', name: 'Arya', phone: '+62 812-345-6789', avatarColor: '#3562FF', recentAmount: 100 },
  { id: 'p_2', name: 'Nafiu', phone: '+62 813-456-7890', avatarColor: '#00C896', recentAmount: 250 },
  { id: 'p_3', name: 'Adzka', phone: '+62 814-567-8901', avatarColor: '#F59E0B', recentAmount: 500 },
  { id: 'p_4', name: 'Jaki', phone: '+62 815-678-9012', avatarColor: '#8B5CF6', recentAmount: 150 }
];

const DEFAULT_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx_1',
    title: 'Paypal Income',
    category: 'income',
    date: 'Today',
    amount: 500.00,
    currency: 'INR',
    status: 'completed',
    iconType: 'paypal',
    note: 'Client payment'
  },
  {
    id: 'tx_2',
    title: 'Electricity',
    category: 'electricity',
    date: '2 Aug | 2026',
    amount: -20.00,
    currency: 'INR',
    status: 'completed',
    iconType: 'electricity',
    note: 'Utility'
  },
  {
    id: 'tx_3',
    title: 'Water',
    category: 'water',
    date: '1 Aug | 2026',
    amount: -20.00,
    currency: 'INR',
    status: 'completed',
    iconType: 'water',
    note: 'Utility'
  },
  {
    id: 'tx_4',
    title: 'Television',
    category: 'internet',
    date: '1 Aug | 2026',
    amount: -20.00,
    currency: 'INR',
    status: 'completed',
    iconType: 'internet',
    note: 'Subscription'
  }
];

export const useStore = create<AppState>()((set, get) => ({
  theme: "light",
  setTheme: (theme) => set({ theme }),
  activeUserId: null,
  receipts: [],
  inventoryAdjustments: [],
  inventorySettings: {},
  budgets: [],
  suppliers: [],

  cards: DEFAULT_CARDS,
  activeCardId: 'card_primary',
  payees: DEFAULT_PAYEES,
  walletTransactions: DEFAULT_TRANSACTIONS,

  switchUserContext: async (userId: string | null, token?: string | null) => {
    if (!userId) {
      // User logged out: wipe all in-memory business data for security
      set({
        activeUserId: null,
        receipts: [],
        inventoryAdjustments: [],
        inventorySettings: {},
        budgets: [],
        suppliers: []
      });
      return;
    }

    set({ activeUserId: userId });

    // Try loading local user data first for instant UI response
    const local = loadUserLocalData(userId);
    if (local) {
      set({
        receipts: local.receipts || [],
        inventoryAdjustments: local.inventoryAdjustments || [],
        inventorySettings: local.inventorySettings || {},
        budgets: local.budgets || [],
        suppliers: local.suppliers || []
      });
    } else {
      set({
        receipts: [],
        inventoryAdjustments: [],
        inventorySettings: {},
        budgets: [],
        suppliers: []
      });
    }

    // Then sync from server if token provided
    if (token) {
      try {
        const res = await fetch('/api/auth/sync-data', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const resJson = await res.json();
          if (resJson.data) {
            const d = resJson.data;
            const updated = {
              receipts: d.receipts || [],
              inventoryAdjustments: d.inventoryAdjustments || [],
              inventorySettings: d.inventorySettings || {},
              budgets: d.budgets || [],
              suppliers: d.suppliers || []
            };
            set(updated);
            saveUserLocalData(userId, updated);
          }
        }
      } catch (err) {
        console.warn('Could not sync user data from server on switch:', err);
      }
    }
  },

  syncToServer: async (token: string) => {
    const state = get();
    if (!state.activeUserId || !token) return;

    try {
      await fetch('/api/auth/sync-data', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          receipts: state.receipts,
          inventoryAdjustments: state.inventoryAdjustments,
          inventorySettings: state.inventorySettings,
          budgets: state.budgets,
          suppliers: state.suppliers
        })
      });
    } catch (err) {
      console.warn('Server sync failed:', err);
    }
  },

  addReceipt: (receipt) =>
    set((state) => {
      const nextReceipts = [...state.receipts, receipt];
      if (state.activeUserId) {
        saveUserLocalData(state.activeUserId, {
          receipts: nextReceipts,
          inventoryAdjustments: state.inventoryAdjustments,
          inventorySettings: state.inventorySettings,
          budgets: state.budgets,
          suppliers: state.suppliers
        });
      }
      return { receipts: nextReceipts };
    }),

  updateReceipt: (id, updates) =>
    set((state) => {
      const nextReceipts = state.receipts.map((r) => (r.id === id ? { ...r, ...updates } : r));
      if (state.activeUserId) {
        saveUserLocalData(state.activeUserId, {
          receipts: nextReceipts,
          inventoryAdjustments: state.inventoryAdjustments,
          inventorySettings: state.inventorySettings,
          budgets: state.budgets,
          suppliers: state.suppliers
        });
      }
      return { receipts: nextReceipts };
    }),

  deleteReceipt: (id) =>
    set((state) => {
      const nextReceipts = state.receipts.filter((r) => r.id !== id);
      if (state.activeUserId) {
        saveUserLocalData(state.activeUserId, {
          receipts: nextReceipts,
          inventoryAdjustments: state.inventoryAdjustments,
          inventorySettings: state.inventorySettings,
          budgets: state.budgets,
          suppliers: state.suppliers
        });
      }
      return { receipts: nextReceipts };
    }),

  clearLedger: () =>
    set((state) => {
      if (state.activeUserId) {
        saveUserLocalData(state.activeUserId, {
          receipts: [],
          inventoryAdjustments: state.inventoryAdjustments,
          inventorySettings: state.inventorySettings,
          budgets: state.budgets,
          suppliers: state.suppliers
        });
      }
      return { receipts: [] };
    }),

  loadSampleData: () =>
    set((state) => {
      const sampleReceipts: Receipt[] = [
        {
          id: 'rec_sample_1',
          merchant: 'Apex Wholesale Provisions',
          supplierId: 'sup_apex',
          date: '2026-09-10',
          total: 12450,
          currency: 'INR',
          captureTimestamp: Date.now() - 7 * 86400000,
          confirmed: true,
          status: 'confirmed',
          items: [
            { id: 'item_1_1', name: 'Fortune Sunflower Oil 5L', qty: 10, unit_price: 680, category: 'Cooking Oil & Ghee', unit: 'cans' },
            { id: 'item_1_2', name: 'India Gate Basmati Rice 25kg', qty: 4, unit_price: 1150, category: 'Rice & Grains', unit: 'bags' },
            { id: 'item_1_3', name: 'Tata Salt Iodized 1kg', qty: 40, unit_price: 26, category: 'Spices & Seasonings', unit: 'packets' }
          ]
        },
        {
          id: 'rec_sample_2',
          merchant: 'Sunrise Dairy & Agro',
          supplierId: 'sup_sunrise',
          date: '2026-09-14',
          total: 8200,
          currency: 'INR',
          captureTimestamp: Date.now() - 3 * 86400000,
          confirmed: true,
          status: 'confirmed',
          items: [
            { id: 'item_2_1', name: 'Amul Pasteurised Butter 500g', qty: 20, unit_price: 275, category: 'Dairy & Frozen', unit: 'blocks' },
            { id: 'item_2_2', name: 'Amul Taaza Milk 1L', qty: 45, unit_price: 60, category: 'Dairy & Frozen', unit: 'litres' }
          ]
        },
        {
          id: 'rec_sample_3',
          merchant: 'Apex Wholesale Provisions',
          supplierId: 'sup_apex',
          date: '2026-09-16',
          total: 9400,
          currency: 'INR',
          captureTimestamp: Date.now() - 1 * 86400000,
          confirmed: true,
          status: 'confirmed',
          items: [
            { id: 'item_3_1', name: 'Fortune Sunflower Oil 5L', qty: 8, unit_price: 720, category: 'Cooking Oil & Ghee', unit: 'cans' },
            { id: 'item_3_2', name: 'India Gate Basmati Rice 25kg', qty: 3, unit_price: 1210, category: 'Rice & Grains', unit: 'bags' }
          ]
        }
      ];

      const sampleSuppliers: Supplier[] = [
        {
          id: 'sup_apex',
          name: 'Apex Wholesale Provisions',
          normalizedName: 'apex wholesale provisions',
          phone: '+91 98200 12345',
          email: 'orders@apexwholesale.in',
          address: 'Plot 12, APMC Market Yard',
          notes: 'Main staples and cooking oil distributor. Delivers on Tuesdays & Fridays.',
          createdAt: new Date().toISOString()
        },
        {
          id: 'sup_sunrise',
          name: 'Sunrise Dairy & Agro',
          normalizedName: 'sunrise dairy agro',
          phone: '+91 98450 67890',
          email: 'supply@sunrisedairy.com',
          address: 'Industrial Area Phase 2',
          notes: 'Daily fresh dairy delivery before 7:00 AM.',
          createdAt: new Date().toISOString()
        }
      ];

      const sampleBudgets: Budget[] = [
        {
          id: 'bud_monthly_stock',
          name: 'Monthly Store Purchases',
          amount: 50000,
          currency: 'INR',
          period: 'monthly',
          startDate: '2026-09-01',
          endDate: '2026-09-30',
          category: '',
          alertThreshold: 80,
          notes: 'Target cap for all store restocks during September',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bud_dairy',
          name: 'Dairy & Perishables',
          amount: 15000,
          currency: 'INR',
          period: 'monthly',
          startDate: '2026-09-01',
          endDate: '2026-09-30',
          category: 'Dairy & Frozen',
          alertThreshold: 85,
          notes: 'Strict threshold for butter and milk supplies',
          createdAt: new Date().toISOString()
        }
      ];

      const sampleSettings: Record<string, InventorySettings> = {
        'fortune sunflower oil 5l': { reorderThreshold: 5 },
        'amul taaza milk 1l': { reorderThreshold: 15 }
      };

      if (state.activeUserId) {
        saveUserLocalData(state.activeUserId, {
          receipts: sampleReceipts,
          inventoryAdjustments: [],
          inventorySettings: sampleSettings,
          budgets: sampleBudgets,
          suppliers: sampleSuppliers
        });
      }

      return {
        receipts: sampleReceipts,
        inventoryAdjustments: [],
        inventorySettings: sampleSettings,
        budgets: sampleBudgets,
        suppliers: sampleSuppliers
      };
    }),

  addInventoryAdjustment: (adjustment) =>
    set((state) => {
      const next = [...state.inventoryAdjustments, adjustment];
      if (state.activeUserId) {
        saveUserLocalData(state.activeUserId, {
          receipts: state.receipts,
          inventoryAdjustments: next,
          inventorySettings: state.inventorySettings,
          budgets: state.budgets,
          suppliers: state.suppliers
        });
      }
      return { inventoryAdjustments: next };
    }),

  updateInventorySettings: (normalizedName, settings) =>
    set((state) => {
      const nextSettings = {
        ...state.inventorySettings,
        [normalizedName]: {
          ...(state.inventorySettings[normalizedName] || {}),
          ...settings,
        },
      };
      if (state.activeUserId) {
        saveUserLocalData(state.activeUserId, {
          receipts: state.receipts,
          inventoryAdjustments: state.inventoryAdjustments,
          inventorySettings: nextSettings,
          budgets: state.budgets,
          suppliers: state.suppliers
        });
      }
      return { inventorySettings: nextSettings };
    }),
    
  addBudget: (budget) =>
    set((state) => {
      const next = [...state.budgets, budget];
      if (state.activeUserId) {
        saveUserLocalData(state.activeUserId, {
          receipts: state.receipts,
          inventoryAdjustments: state.inventoryAdjustments,
          inventorySettings: state.inventorySettings,
          budgets: next,
          suppliers: state.suppliers
        });
      }
      return { budgets: next };
    }),

  updateBudget: (id, updates) =>
    set((state) => {
      const next = state.budgets.map((b) => (b.id === id ? { ...b, ...updates } : b));
      if (state.activeUserId) {
        saveUserLocalData(state.activeUserId, {
          receipts: state.receipts,
          inventoryAdjustments: state.inventoryAdjustments,
          inventorySettings: state.inventorySettings,
          budgets: next,
          suppliers: state.suppliers
        });
      }
      return { budgets: next };
    }),

  deleteBudget: (id) =>
    set((state) => {
      const next = state.budgets.filter((b) => b.id !== id);
      if (state.activeUserId) {
        saveUserLocalData(state.activeUserId, {
          receipts: state.receipts,
          inventoryAdjustments: state.inventoryAdjustments,
          inventorySettings: state.inventorySettings,
          budgets: next,
          suppliers: state.suppliers
        });
      }
      return { budgets: next };
    }),

  addSupplier: (supplier) =>
    set((state) => {
      const next = [...state.suppliers, supplier];
      if (state.activeUserId) {
        saveUserLocalData(state.activeUserId, {
          receipts: state.receipts,
          inventoryAdjustments: state.inventoryAdjustments,
          inventorySettings: state.inventorySettings,
          budgets: state.budgets,
          suppliers: next
        });
      }
      return { suppliers: next };
    }),

  updateSupplier: (id, updates) =>
    set((state) => {
      const next = state.suppliers.map((s) => (s.id === id ? { ...s, ...updates } : s));
      if (state.activeUserId) {
        saveUserLocalData(state.activeUserId, {
          receipts: state.receipts,
          inventoryAdjustments: state.inventoryAdjustments,
          inventorySettings: state.inventorySettings,
          budgets: state.budgets,
          suppliers: next
        });
      }
      return { suppliers: next };
    }),

  deleteSupplier: (id) =>
    set((state) => {
      const next = state.suppliers.filter((s) => s.id !== id);
      if (state.activeUserId) {
        saveUserLocalData(state.activeUserId, {
          receipts: state.receipts,
          inventoryAdjustments: state.inventoryAdjustments,
          inventorySettings: state.inventorySettings,
          budgets: state.budgets,
          suppliers: next
        });
      }
      return { suppliers: next };
    }),

  sendTransfer: (payeeName, amount, note) =>
    set((state) => {
      const card = state.cards.find((c) => c.id === state.activeCardId) || state.cards[0];
      const newTx: WalletTransaction = {
        id: crypto.randomUUID(),
        title: `Transfer to ${payeeName}`,
        category: 'transfer',
        date: 'Today',
        amount: -amount,
        currency: card ? card.currency : 'INR',
        status: 'completed',
        iconType: 'transfer',
        recipient: payeeName,
        note: note || 'Transfer'
      };
      const updatedCards = state.cards.map((c) =>
        c.id === (card?.id || 'card_primary')
          ? { ...c, balance: Math.max(0, Number((c.balance - amount).toFixed(2))) }
          : c
      );
      return {
        cards: updatedCards,
        walletTransactions: [newTx, ...state.walletTransactions]
      };
    }),

  payBill: (title, category, amount) =>
    set((state) => {
      const card = state.cards.find((c) => c.id === state.activeCardId) || state.cards[0];
      const newTx: WalletTransaction = {
        id: crypto.randomUUID(),
        title,
        category,
        date: 'Today',
        amount: -amount,
        currency: card ? card.currency : 'INR',
        status: 'completed',
        iconType: category,
        note: 'Bill payment'
      };
      const updatedCards = state.cards.map((c) =>
        c.id === (card?.id || 'card_primary')
          ? { ...c, balance: Math.max(0, Number((c.balance - amount).toFixed(2))) }
          : c
      );
      return {
        cards: updatedCards,
        walletTransactions: [newTx, ...state.walletTransactions]
      };
    }),

  topUp: (amount) =>
    set((state) => {
      const card = state.cards.find((c) => c.id === state.activeCardId) || state.cards[0];
      const newTx: WalletTransaction = {
        id: crypto.randomUUID(),
        title: 'Top Up Deposit',
        category: 'income',
        date: 'Today',
        amount: amount,
        currency: card ? card.currency : 'INR',
        status: 'completed',
        iconType: 'topup',
        note: 'Wallet Top Up'
      };
      const updatedCards = state.cards.map((c) =>
        c.id === (card?.id || 'card_primary')
          ? { ...c, balance: Number((c.balance + amount).toFixed(2)) }
          : c
      );
      return {
        cards: updatedCards,
        walletTransactions: [newTx, ...state.walletTransactions]
      };
    }),

  setActiveCard: (cardId) => set({ activeCardId: cardId }),
  addCard: (card) => set((state) => ({ cards: [...state.cards, card], activeCardId: card.id })),
}));

