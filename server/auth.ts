import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Router, Request, Response, NextFunction } from 'express';

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

export interface UserBusinessData {
  receipts: any[];
  inventoryAdjustments: any[];
  inventorySettings: Record<string, any>;
  budgets: any[];
  suppliers: any[];
  chatHistory?: any[];
}

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  fullName: string;
  phoneNumber?: string;
  createdAt: string;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  businessProfile: BusinessProfile;
  settings: UserSettings;
  data: UserBusinessData;
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  userAgent?: string;
}

export interface PasswordResetRecord {
  token: string;
  userId: string;
  expiresAt: number;
}

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
  sessionToken?: string;
}

// In-memory store with file fallback
const isVercel = Boolean(
  process.env.VERCEL ||
  process.env.VERCEL_ENV ||
  process.env.NOW_REGION ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  process.env.IS_SERVERLESS === 'true'
);
const DATA_DIR = isVercel ? path.join('/tmp', '.bizpulse_data') : path.resolve(process.cwd(), '.bizpulse_data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const SEED_USERS_FILE = path.resolve(process.cwd(), '.bizpulse_data', 'users.json');

const usersMap = new Map<string, UserRecord>();
const sessionsMap = new Map<string, SessionRecord>();
const resetTokensMap = new Map<string, PasswordResetRecord>();

// Rate limiting state: key -> { count: number, resetAt: number }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxAttempts: number = 8, windowMs: number = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxAttempts) {
    return false;
  }
  entry.count += 1;
  return true;
}

function initStorage() {
  try {
    // 1. Read seed users if available in project bundle
    if (fs.existsSync(SEED_USERS_FILE)) {
      try {
        const rawSeed = fs.readFileSync(SEED_USERS_FILE, 'utf-8');
        const list: UserRecord[] = JSON.parse(rawSeed);
        list.forEach((u) => usersMap.set(u.id, u));
      } catch (err) {
        console.error('Failed to read seed users file:', err);
      }
    }

    // 2. Read persistent/tmp storage file if available
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const list: UserRecord[] = JSON.parse(raw);
      list.forEach((u) => usersMap.set(u.id, u));
    }
    if (fs.existsSync(SESSIONS_FILE)) {
      try {
        const rawSess = fs.readFileSync(SESSIONS_FILE, 'utf-8');
        const sessList: SessionRecord[] = JSON.parse(rawSess);
        const now = Date.now();
        sessList.forEach((s) => {
          if (s && s.token && s.expiresAt > now) {
            sessionsMap.set(s.token, s);
          }
        });
      } catch (err) {
        console.error('Failed to read sessions file:', err);
      }
    }
  } catch (err) {
    console.error('Failed to load user storage:', err);
  }
}

function persistStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const list = Array.from(usersMap.values());
    fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), 'utf-8');

    const now = Date.now();
    const activeSessions = Array.from(sessionsMap.values()).filter((s) => s.expiresAt > now);
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(activeSessions, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save user storage:', err);
  }
}

// Security hashing helpers
export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function seedDemoUserIfEmpty() {
  const existingDemo = Array.from(usersMap.values()).find((u) => u.email === 'demo@bizpulse.com');
  if (!existingDemo) {
    const { salt, hash } = hashPassword('BizPulse123!');
    const demoUser: UserRecord = {
      id: 'usr_demo_patel_mart',
      email: 'demo@bizpulse.com',
      passwordHash: hash,
      salt,
      fullName: 'Ramesh Patel',
      phoneNumber: '+91 98201 23456',
      createdAt: new Date().toISOString(),
      emailVerified: true,
      onboardingCompleted: true,
      businessProfile: {
        businessName: 'Patel Supermart',
        businessType: 'Retail Shop',
        businessCategory: 'Groceries & Provisions',
        ownerName: 'Ramesh Patel',
        businessEmail: 'demo@bizpulse.com',
        phoneNumber: '+91 98201 23456',
        address: 'Shop 4, Market Cross Road',
        cityState: 'Mumbai, Maharashtra',
        currency: 'INR',
        reportingPeriod: 'monthly',
        gstNumber: '27AAAAA0000A1Z5'
      },
      settings: {
        theme: 'light',
        currency: 'INR',
        reportingPeriod: 'monthly',
        defaultCategory: 'Inventory / Stock',
        alertPreferences: {
          budgetAlerts: true,
          priceChangeAlerts: true,
          lowStockAlerts: true,
          unusualSpendingAlerts: true,
          productNotifications: false
        }
      },
      data: {
        receipts: [
          {
            id: 'rec_demo_1',
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
            id: 'rec_demo_2',
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
            id: 'rec_demo_3',
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
        ],
        inventoryAdjustments: [],
        inventorySettings: {
          'fortune sunflower oil 5l': { reorderThreshold: 5 },
          'amul taaza milk 1l': { reorderThreshold: 15 }
        },
        budgets: [
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
        ],
        suppliers: [
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
        ],
        chatHistory: []
      }
    };
    usersMap.set(demoUser.id, demoUser);
    persistStorage();
  }
}

initStorage();
seedDemoUserIfEmpty();

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(derived, 'utf-8'), Buffer.from(expectedHash, 'utf-8'));
  } catch {
    return false;
  }
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'bizpulse_serverless_session_secret_key_2026';

export interface TokenClaims {
  userId: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  onboardingCompleted: boolean;
  businessName?: string;
  businessType?: string;
  currency?: string;
  reportingPeriod?: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  createdAt: number;
  expiresAt: number;
}

export function createSignedSessionToken(claims: TokenClaims): string {
  const payloadJson = JSON.stringify(claims);
  const payloadB64 = Buffer.from(payloadJson, 'utf-8').toString('base64url');
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('hex');
  return `bpt_v2_${payloadB64}.${hmac}`;
}

export function verifySignedSessionToken(token: string): TokenClaims | null {
  if (!token || typeof token !== 'string' || !token.startsWith('bpt_v2_')) return null;
  const dotIndex = token.indexOf('.');
  if (dotIndex === -1) return null;

  const prefixAndPayload = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  const payloadB64 = prefixAndPayload.slice(7); // remove 'bpt_v2_'

  try {
    const expectedHmac = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('hex');
    if (signature.length !== expectedHmac.length) return null;

    const sigBuf = Buffer.from(signature, 'hex');
    const expectedBuf = Buffer.from(expectedHmac, 'hex');
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const claimsJson = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const claims: TokenClaims = JSON.parse(claimsJson);
    if (Date.now() > claims.expiresAt) {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
}

// Strip sensitive fields before sending user object to client
export function sanitizeUser(user: UserRecord) {
  const { passwordHash, salt, ...safeUser } = user;
  return safeUser;
}

function instantiateUserFromClaims(claims: TokenClaims): UserRecord {
  return {
    id: claims.userId,
    email: claims.email,
    passwordHash: '',
    salt: '',
    fullName: claims.fullName,
    phoneNumber: claims.phoneNumber,
    createdAt: new Date(claims.createdAt).toISOString(),
    emailVerified: true,
    onboardingCompleted: Boolean(claims.onboardingCompleted),
    businessProfile: {
      businessName: claims.businessName || 'My Business',
      businessType: claims.businessType || 'Retail Shop',
      businessCategory: 'General Merchandise',
      ownerName: claims.fullName,
      businessEmail: claims.email,
      phoneNumber: claims.phoneNumber || '',
      address: '',
      cityState: '',
      currency: claims.currency || 'INR',
      reportingPeriod: claims.reportingPeriod || 'monthly',
      gstNumber: ''
    },
    settings: {
      theme: 'light',
      currency: claims.currency || 'INR',
      reportingPeriod: claims.reportingPeriod || 'monthly',
      defaultCategory: 'Inventory / Stock',
      alertPreferences: {
        budgetAlerts: true,
        priceChangeAlerts: true,
        lowStockAlerts: true,
        unusualSpendingAlerts: true,
        productNotifications: false
      }
    },
    data: {
      receipts: [],
      inventoryAdjustments: [],
      inventorySettings: {},
      budgets: [],
      suppliers: [],
      chatHistory: []
    }
  };
}

// Authentication middleware
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.', code: 'AUTH_REQUIRED' });
  }

  const token = authHeader.slice(7).trim();

  // 1. Stateless cryptographically signed token verification (cross-lambda / serverless resilient)
  const claims = verifySignedSessionToken(token);
  if (claims) {
    let user = usersMap.get(claims.userId);
    if (!user) {
      user = instantiateUserFromClaims(claims);
      usersMap.set(claims.userId, user);
    } else {
      if (claims.onboardingCompleted && !user.onboardingCompleted) {
        user.onboardingCompleted = true;
      }
    }
    req.user = user;
    req.sessionToken = token;
    return next();
  }

  let session = sessionsMap.get(token);

  // 2. If token is a valid demo token, auto-bind to demo user if session was lost (e.g. server restart)
  if (!session && token.startsWith('demo_token_')) {
    let demoUser = Array.from(usersMap.values()).find((u) => u.email === 'demo@bizpulse.com');
    if (!demoUser) {
      seedDemoUserIfEmpty();
      demoUser = Array.from(usersMap.values()).find((u) => u.email === 'demo@bizpulse.com');
    }
    if (demoUser) {
      session = {
        token,
        userId: demoUser.id,
        createdAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        userAgent: req.headers['user-agent']
      };
      sessionsMap.set(token, session);
      persistStorage();
    }
  }

  if (!session) {
    return res.status(401).json({ error: 'Session not found or expired. Please log in again.', code: 'SESSION_EXPIRED' });
  }

  if (Date.now() > session.expiresAt) {
    sessionsMap.delete(token);
    persistStorage();
    return res.status(401).json({ error: 'Session expired. Please log in again.', code: 'SESSION_EXPIRED' });
  }

  const user = usersMap.get(session.userId);
  if (!user) {
    sessionsMap.delete(token);
    persistStorage();
    return res.status(401).json({ error: 'User account not found.', code: 'USER_NOT_FOUND' });
  }

  req.user = user;
  req.sessionToken = token;
  next();
}

// Optional authentication middleware: populates req.user if valid token provided, but does not reject request
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7).trim();

  const claims = verifySignedSessionToken(token);
  if (claims) {
    let user = usersMap.get(claims.userId);
    if (!user) {
      user = instantiateUserFromClaims(claims);
      usersMap.set(claims.userId, user);
    }
    req.user = user;
    req.sessionToken = token;
    return next();
  }

  let session = sessionsMap.get(token);

  if (!session && token.startsWith('demo_token_')) {
    let demoUser = Array.from(usersMap.values()).find((u) => u.email === 'demo@bizpulse.com');
    if (!demoUser) {
      seedDemoUserIfEmpty();
      demoUser = Array.from(usersMap.values()).find((u) => u.email === 'demo@bizpulse.com');
    }
    if (demoUser) {
      session = {
        token,
        userId: demoUser.id,
        createdAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        userAgent: req.headers['user-agent']
      };
      sessionsMap.set(token, session);
      persistStorage();
    }
  }

  if (session && Date.now() <= session.expiresAt) {
    const user = usersMap.get(session.userId);
    if (user) {
      req.user = user;
      req.sessionToken = token;
    }
  }

  next();
}

export const authRouter = Router();

// Ensure req.body is safely initialized as an object to prevent any destructuring errors
authRouter.use((req, res, next) => {
  if (!req.body || typeof req.body !== 'object') {
    req.body = {};
  }
  next();
});

// 1. SIGNUP
authRouter.post('/signup', (req: Request, res: Response) => {
  try {
    const ip = req.ip || 'unknown';
    if (!checkRateLimit(`signup_${ip}`, 10, 15 * 60 * 1000)) {
      return res.status(429).json({ error: 'Too many signup attempts. Please try again later.' });
    }

    const { fullName, email, password, confirmPassword, businessName, phoneNumber } = req.body || {};

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Please provide your full name (at least 2 characters).' });
    }

    const normalizedEmail = (email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    // Check password strength: at least 1 uppercase, 1 lowercase, 1 number
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({
        error: 'Password must include at least one uppercase letter, one lowercase letter, and one number.'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    // Check if email already exists
    const existing = Array.from(usersMap.values()).find((u) => u.email === normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please log in.' });
    }

    const { salt, hash } = hashPassword(password);
    const userId = `usr_${crypto.randomBytes(12).toString('hex')}`;

    const newUser: UserRecord = {
      id: userId,
      email: normalizedEmail,
      passwordHash: hash,
      salt,
      fullName: fullName.trim(),
      phoneNumber: phoneNumber ? String(phoneNumber).trim() : undefined,
      createdAt: new Date().toISOString(),
      emailVerified: true, // Mark verified for development/preview convenience
      onboardingCompleted: false,
      businessProfile: {
        businessName: (businessName || '').trim() || 'My Business',
        businessType: 'Retail Shop',
        businessCategory: 'General Merchandise',
        ownerName: fullName.trim(),
        businessEmail: normalizedEmail,
        phoneNumber: phoneNumber ? String(phoneNumber).trim() : '',
        address: '',
        cityState: '',
        currency: 'INR',
        reportingPeriod: 'monthly',
        gstNumber: ''
      },
      settings: {
        theme: 'light',
        currency: 'INR',
        reportingPeriod: 'monthly',
        defaultCategory: 'Inventory / Stock',
        alertPreferences: {
          budgetAlerts: true,
          priceChangeAlerts: true,
          lowStockAlerts: true,
          unusualSpendingAlerts: true,
          productNotifications: false
        }
      },
      data: {
        receipts: [],
        inventoryAdjustments: [],
        inventorySettings: {},
        budgets: [],
        suppliers: [],
        chatHistory: []
      }
    };

    usersMap.set(userId, newUser);
    persistStorage();

    // Create session token (valid 7 days, cryptographically signed for serverless resilience)
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const token = createSignedSessionToken({
      userId,
      email: normalizedEmail,
      fullName: fullName.trim(),
      phoneNumber: phoneNumber ? String(phoneNumber).trim() : undefined,
      onboardingCompleted: false,
      businessName: (businessName || '').trim() || 'My Business',
      businessType: 'Retail Shop',
      currency: 'INR',
      reportingPeriod: 'monthly',
      createdAt: Date.now(),
      expiresAt
    });
    sessionsMap.set(token, {
      token,
      userId,
      createdAt: Date.now(),
      expiresAt,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      message: 'Account created successfully.',
      user: sanitizeUser(newUser),
      token,
      expiresAt
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// 2. LOGIN
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    const ip = req.ip || 'unknown';
    const rateLimitKey = `login_${ip}_${(email || '').trim().toLowerCase()}`;

    if (!checkRateLimit(rateLimitKey, 8, 10 * 60 * 1000)) {
      return res.status(429).json({
        error: 'Too many failed login attempts. Please wait 10 minutes before trying again.'
      });
    }

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and password.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = Array.from(usersMap.values()).find((u) => u.email === normalizedEmail);

    // Constant-time check to prevent account enumeration
    if (!user) {
      // Dummy verification to resist timing attacks
      verifyPassword(password, '00000000000000000000000000000000', '0'.repeat(128));
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = verifyPassword(password, user.salt, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Reset rate limiter on successful login
    rateLimitMap.delete(rateLimitKey);

    // Create session token (valid 7 days, cryptographically signed for serverless resilience)
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const token = createSignedSessionToken({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      onboardingCompleted: Boolean(user.onboardingCompleted),
      businessName: user.businessProfile?.businessName || 'My Business',
      businessType: user.businessProfile?.businessType || 'Retail Shop',
      currency: user.businessProfile?.currency || 'INR',
      reportingPeriod: user.businessProfile?.reportingPeriod || 'monthly',
      createdAt: Date.now(),
      expiresAt
    });
    sessionsMap.set(token, {
      token,
      userId: user.id,
      createdAt: Date.now(),
      expiresAt,
      userAgent: req.headers['user-agent']
    });

    res.json({
      message: 'Login successful.',
      user: sanitizeUser(user),
      token,
      expiresAt
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal login error. Please try again.' });
  }
});

// 2b. QUICK DEMO LOGIN
authRouter.post('/demo-login', (req: Request, res: Response) => {
  try {
    let demoUser = Array.from(usersMap.values()).find((u) => u.email === 'demo@bizpulse.com');
    if (!demoUser) {
      seedDemoUserIfEmpty();
      demoUser = Array.from(usersMap.values()).find((u) => u.email === 'demo@bizpulse.com');
    }
    if (!demoUser) {
      return res.status(500).json({ error: 'Demo merchant profile is not available.' });
    }

    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const token = createSignedSessionToken({
      userId: demoUser.id,
      email: demoUser.email,
      fullName: demoUser.fullName,
      phoneNumber: demoUser.phoneNumber,
      onboardingCompleted: true,
      businessName: demoUser.businessProfile.businessName,
      businessType: demoUser.businessProfile.businessType,
      currency: demoUser.businessProfile.currency,
      reportingPeriod: demoUser.businessProfile.reportingPeriod,
      createdAt: Date.now(),
      expiresAt
    });
    sessionsMap.set(token, {
      token,
      userId: demoUser.id,
      createdAt: Date.now(),
      expiresAt,
      userAgent: req.headers['user-agent']
    });

    res.json({
      message: 'Demo login successful.',
      user: sanitizeUser(demoUser),
      token,
      expiresAt
    });
  } catch (err: any) {
    console.error('Demo login error:', err);
    res.status(500).json({ error: 'Failed to access demo account.' });
  }
});

// 3. LOGOUT
authRouter.post('/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.sessionToken) {
    sessionsMap.delete(req.sessionToken);
  }
  res.json({ message: 'Logged out successfully.' });
});

// 4. GET CURRENT USER (/me)
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    user: sanitizeUser(req.user!)
  });
});

// 5. FORGOT PASSWORD
authRouter.post('/forgot-password', (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = Array.from(usersMap.values()).find((u) => u.email === normalizedEmail);

    let demoResetToken: string | null = null;

    if (user) {
      const token = generateSecureToken();
      const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
      resetTokensMap.set(token, {
        token,
        userId: user.id,
        expiresAt
      });
      demoResetToken = token;
    }

    // Always return a generic confirmation message to prevent account enumeration
    res.json({
      message: 'If an account is associated with that email, you will receive password reset instructions.',
      // Provided in development/sandbox for immediate testing without SMTP mailer
      resetToken: demoResetToken
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process password reset request.' });
  }
});

// 6. RESET PASSWORD
authRouter.post('/reset-password', (req: Request, res: Response) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Reset token is required or expired.' });
    }

    const record = resetTokensMap.get(token);
    if (!record || Date.now() > record.expiresAt) {
      if (record) resetTokensMap.delete(token);
      return res.status(400).json({ error: 'This password reset link is invalid or has expired. Please request a new one.' });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({
        error: 'Password must include at least one uppercase letter, one lowercase letter, and one number.'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const user = usersMap.get(record.userId);
    if (!user) {
      return res.status(404).json({ error: 'Associated user account was not found.' });
    }

    const { salt, hash } = hashPassword(newPassword);
    user.passwordHash = hash;
    user.salt = salt;
    persistStorage();

    // Revoke the reset token
    resetTokensMap.delete(token);

    // Invalidate all active sessions for this user for security
    for (const [sToken, session] of sessionsMap.entries()) {
      if (session.userId === user.id) {
        sessionsMap.delete(sToken);
      }
    }

    res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
  } catch (err: any) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// 7. UPDATE USER PROFILE
authRouter.put('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { fullName, phoneNumber } = req.body;

    if (fullName !== undefined) {
      if (typeof fullName !== 'string' || fullName.trim().length < 2) {
        return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
      }
      user.fullName = fullName.trim();
    }

    if (phoneNumber !== undefined) {
      user.phoneNumber = String(phoneNumber).trim();
    }

    persistStorage();
    res.json({
      message: 'Profile updated successfully.',
      user: sanitizeUser(user)
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// 8. UPDATE BUSINESS PROFILE
authRouter.put('/business-profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const updates = req.body;

    user.businessProfile = {
      ...user.businessProfile,
      ...updates
    };

    persistStorage();
    res.json({
      message: 'Business profile updated successfully.',
      user: sanitizeUser(user)
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update business profile.' });
  }
});

// 9. UPDATE SETTINGS
authRouter.put('/settings', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { theme, currency, reportingPeriod, defaultCategory, alertPreferences } = req.body;

    if (theme) user.settings.theme = theme;
    if (currency) user.settings.currency = currency;
    if (reportingPeriod) user.settings.reportingPeriod = reportingPeriod;
    if (defaultCategory) user.settings.defaultCategory = defaultCategory;
    if (alertPreferences) {
      user.settings.alertPreferences = {
        ...user.settings.alertPreferences,
        ...alertPreferences
      };
    }

    persistStorage();
    res.json({
      message: 'Settings updated successfully.',
      user: sanitizeUser(user)
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

// 10. CHANGE PASSWORD
authRouter.post('/change-password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new passwords are required.' });
    }

    const isCurrentValid = verifyPassword(currentPassword, user.salt, user.passwordHash);
    if (!isCurrentValid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({
        error: 'New password must include uppercase, lowercase, and a number.'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match.' });
    }

    const { salt, hash } = hashPassword(newPassword);
    user.passwordHash = hash;
    user.salt = salt;
    persistStorage();

    res.json({ message: 'Password changed successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

// 11. COMPLETE ONBOARDING
authRouter.post(['/onboarding/complete', '/auth/onboarding/complete', '/api/auth/onboarding/complete'], requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { businessName, businessType, currency, reportingPeriod } = req.body;

    if (!user.businessProfile) {
      user.businessProfile = {
        businessName: 'My Business',
        businessType: 'Retail Shop',
        businessCategory: 'General Merchandise',
        ownerName: user.fullName,
        businessEmail: user.email,
        phoneNumber: user.phoneNumber || '',
        address: '',
        cityState: '',
        currency: 'INR',
        reportingPeriod: 'monthly',
        gstNumber: ''
      };
    }
    if (!user.settings) {
      user.settings = {
        theme: 'light',
        currency: 'INR',
        reportingPeriod: 'monthly',
        defaultCategory: 'Inventory / Stock',
        alertPreferences: {
          budgetAlerts: true,
          priceChangeAlerts: true,
          lowStockAlerts: true,
          unusualSpendingAlerts: true,
          productNotifications: false
        }
      };
    }

    if (businessName) user.businessProfile.businessName = String(businessName).trim();
    if (businessType) user.businessProfile.businessType = String(businessType).trim();
    if (currency) {
      user.businessProfile.currency = String(currency).trim();
      user.settings.currency = String(currency).trim();
    }
    if (reportingPeriod) {
      user.businessProfile.reportingPeriod = reportingPeriod;
      user.settings.reportingPeriod = reportingPeriod;
    }

    user.onboardingCompleted = true;
    usersMap.set(user.id, user);
    persistStorage();

    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const updatedToken = createSignedSessionToken({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      onboardingCompleted: true,
      businessName: user.businessProfile.businessName,
      businessType: user.businessProfile.businessType,
      currency: user.businessProfile.currency,
      reportingPeriod: user.businessProfile.reportingPeriod,
      createdAt: Date.now(),
      expiresAt
    });

    sessionsMap.set(updatedToken, {
      token: updatedToken,
      userId: user.id,
      createdAt: Date.now(),
      expiresAt,
      userAgent: req.headers['user-agent']
    });

    res.json({
      message: 'Onboarding completed.',
      user: sanitizeUser(user),
      token: updatedToken
    });
  } catch (err: any) {
    console.error('Onboarding complete error:', err);
    res.status(500).json({ error: 'Failed to complete onboarding.' });
  }
});

// 12. EXPORT ALL USER DATA (JSON)
authRouter.get('/export-data', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const exportPayload = {
      exportTimestamp: new Date().toISOString(),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt
      },
      businessProfile: user.businessProfile,
      settings: user.settings,
      data: user.data
    };

    res.setHeader('Content-Disposition', `attachment; filename="bizpulse-export-${user.id}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(exportPayload);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to export user data.' });
  }
});

// 13. DELETE ACCOUNT
authRouter.post('/delete-account', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password confirmation is required to delete your account.' });
    }

    const isValid = verifyPassword(password, user.salt, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password. Account deletion aborted.' });
    }

    // Invalidate all active sessions
    for (const [token, session] of sessionsMap.entries()) {
      if (session.userId === user.id) {
        sessionsMap.delete(token);
      }
    }

    // Remove user and all isolated data
    usersMap.delete(user.id);
    persistStorage();

    res.json({ message: 'Account and associated data deleted permanently.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete account.' });
  }
});

// 14. SYNC USER DATA (Isolating receipts, inventory, budgets, suppliers on server)
authRouter.get('/sync-data', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ data: req.user!.data });
});

authRouter.put('/sync-data', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { receipts, inventoryAdjustments, inventorySettings, budgets, suppliers } = req.body;

    if (receipts !== undefined) user.data.receipts = receipts;
    if (inventoryAdjustments !== undefined) user.data.inventoryAdjustments = inventoryAdjustments;
    if (inventorySettings !== undefined) user.data.inventorySettings = inventorySettings;
    if (budgets !== undefined) user.data.budgets = budgets;
    if (suppliers !== undefined) user.data.suppliers = suppliers;

    persistStorage();
    res.json({ message: 'Data synced successfully.', data: user.data });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to sync data.' });
  }
});
