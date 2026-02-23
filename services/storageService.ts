import { SKU, Partner, Promotion, SalesReport, PartnerType, Id, PromotionType, User } from '../types';

const KEYS = {
  SKUS: 'dji_skus',
  PARTNERS: 'dji_partners',
  PROMOTIONS: 'dji_promotions',
  SALES: 'dji_sales',
  USERS: 'dji_users',
};

// Initial Mock Data
const INITIAL_SKUS: SKU[] = [
  { _id: '1' as Id<"skus">, code: 'DJI-MVM400P', name: 'DJI Mini 4 Pro (GL)', category: 'Drone', originalPrice: 759, _creationTime: Date.now() },
  { _id: '2' as Id<"skus">, code: 'DJI-MAVIC-3', name: 'DJI Mavic 3 Pro', category: 'Drone', originalPrice: 2199, _creationTime: Date.now() },
  { _id: '3' as Id<"skus">, code: 'DJI-OSMO-6', name: 'Osmo Mobile 6', category: 'Handheld', originalPrice: 149, _creationTime: Date.now() },
  { _id: '4' as Id<"skus">, code: 'DJI-AIR-3', name: 'DJI Air 3', category: 'Drone', originalPrice: 1099, _creationTime: Date.now() },
  { _id: '5' as Id<"skus">, code: 'DJI-PKT-3', name: 'Osmo Pocket 3', category: 'Handheld', originalPrice: 519, _creationTime: Date.now() },
];

const INITIAL_PARTNERS: Partner[] = [
  { _id: '1' as Id<"partners">, name: 'Virgin', type: PartnerType.DEALER, email: 'sales@virgin.ae', country: 'UAE', discountRate: 15, _creationTime: Date.now() },
  { _id: '2' as Id<"partners">, name: 'Jumbo', type: PartnerType.DEALER, email: 'contact@jumbo.ae', country: 'UAE', discountRate: 15, _creationTime: Date.now() },
  { _id: '3' as Id<"partners">, name: 'SDG', type: PartnerType.DEALER, email: 'info@sdg.ae', country: 'UAE', discountRate: 12, _creationTime: Date.now() },
  { _id: '4' as Id<"partners">, name: 'DDF', type: PartnerType.DEALER, email: 'purchasing@ddf.ae', country: 'UAE', discountRate: 10, _creationTime: Date.now() },
  { _id: '5' as Id<"partners">, name: 'Emax', type: PartnerType.DEALER, email: 'vendor@emax.ae', country: 'UAE', discountRate: 15, _creationTime: Date.now() },
  { _id: '6' as Id<"partners">, name: 'Amazon', type: PartnerType.TRADER, email: 'vendor-central@amazon.ae', country: 'UAE', discountRate: 0, _creationTime: Date.now() },
  { _id: '7' as Id<"partners">, name: 'Noon', type: PartnerType.TRADER, email: 'seller@noon.com', country: 'UAE', discountRate: 0, _creationTime: Date.now() },
];

// Seed the Super Admin User AND create users for all initial partners
const INITIAL_USERS: User[] = [
  {
    id: 'admin-1',
    name: 'Yahya (Super Admin)',
    email: 'yahya@amt.tv',
    password: '123456', // In a real app, this would be hashed
    role: 'ADMIN'
  },
  // Map existing partners to Users automatically
  ...INITIAL_PARTNERS.map(p => ({
    id: `user-${p._id}`,
    name: p.name,
    email: p.email,
    password: '123456',
    role: 'PARTNER' as const,
    partnerId: p._id
  }))
];

export const storageService = {
  // --- SKUs ---
  getSKUs: (): SKU[] => {
    const data = localStorage.getItem(KEYS.SKUS);
    return data ? JSON.parse(data) : INITIAL_SKUS;
  },
  saveSKUs: (skus: SKU[]) => localStorage.setItem(KEYS.SKUS, JSON.stringify(skus)),
  
  addSKU: (sku: Omit<SKU, '_id' | '_creationTime'>) => {
    const items = storageService.getSKUs();
    const newItem = { ...sku, _id: crypto.randomUUID() as Id<"skus">, _creationTime: Date.now() };
    storageService.saveSKUs([newItem, ...items]);
    return newItem;
  },
  // BATCH ADD: Significantly faster for imports
  addSKUs: (skus: Omit<SKU, '_id' | '_creationTime'>[]) => {
    const items = storageService.getSKUs();
    const newItems = skus.map(sku => ({
        ...sku,
        _id: crypto.randomUUID() as Id<"skus">,
        _creationTime: Date.now()
    }));
    storageService.saveSKUs([...newItems, ...items]);
    return newItems;
  },
  updateSKU: (id: string, updates: Partial<SKU>) => {
    const items = storageService.getSKUs();
    const index = items.findIndex(i => i._id === id);
    if (index > -1) {
      items[index] = { ...items[index], ...updates };
      storageService.saveSKUs(items);
    }
  },
  deleteSKU: (id: string) => {
    const items = storageService.getSKUs().filter(i => i._id !== id);
    storageService.saveSKUs(items);
  },
  // BATCH DELETE
  deleteSKUs: (ids: string[]) => {
    const items = storageService.getSKUs();
    const filteredItems = items.filter(i => !ids.includes(i._id));
    storageService.saveSKUs(filteredItems);
  },

  // --- Partners ---
  getPartners: (): Partner[] => {
    const data = localStorage.getItem(KEYS.PARTNERS);
    return data ? JSON.parse(data) : INITIAL_PARTNERS;
  },
  savePartners: (partners: Partner[]) => localStorage.setItem(KEYS.PARTNERS, JSON.stringify(partners)),
  
  addPartner: (partner: Omit<Partner, '_id' | '_creationTime'>) => {
    const items = storageService.getPartners();
    const newItem = { ...partner, _id: crypto.randomUUID() as Id<"partners">, _creationTime: Date.now() };
    storageService.savePartners([newItem, ...items]);
    return newItem;
  },
  updatePartner: (id: string, updates: Partial<Partner>) => {
    const items = storageService.getPartners();
    const index = items.findIndex(i => i._id === id);
    if (index > -1) {
      items[index] = { ...items[index], ...updates };
      storageService.savePartners(items);
    }
  },
  deletePartner: (id: string) => {
    const items = storageService.getPartners().filter(i => i._id !== id);
    storageService.savePartners(items);
  },

  // --- Promotions ---
  getPromotions: (): Promotion[] => {
    const data = localStorage.getItem(KEYS.PROMOTIONS);
    return data ? JSON.parse(data) : [];
  },
  savePromotions: (promos: Promotion[]) => localStorage.setItem(KEYS.PROMOTIONS, JSON.stringify(promos)),
  
  addPromotion: (promo: Omit<Promotion, '_id' | '_creationTime'>) => {
    const items = storageService.getPromotions();
    const newItem = { ...promo, _id: crypto.randomUUID() as Id<"promotions">, _creationTime: Date.now() };
    storageService.savePromotions([newItem, ...items]);
    return newItem;
  },
  updatePromotion: (id: string, updates: Partial<Promotion>) => {
    const items = storageService.getPromotions();
    const index = items.findIndex(i => i._id === id);
    if (index > -1) {
      items[index] = { ...items[index], ...updates };
      storageService.savePromotions(items);
    }
  },
  deletePromotion: (id: string) => {
    const items = storageService.getPromotions().filter(i => i._id !== id);
    storageService.savePromotions(items);
  },

  // --- Sales ---
  getSalesReports: (): SalesReport[] => {
    const data = localStorage.getItem(KEYS.SALES);
    return data ? JSON.parse(data) : [];
  },
  saveSalesReports: (reports: SalesReport[]) => localStorage.setItem(KEYS.SALES, JSON.stringify(reports)),
  
  addSale: (sale: Omit<SalesReport, '_id' | '_creationTime' | 'paymentStatus'>) => {
    const items = storageService.getSalesReports();
    const newItem: SalesReport = { 
      ...sale, 
      paymentStatus: 'UNPAID', // Default to UNPAID
      _id: crypto.randomUUID() as Id<"sales">, 
      _creationTime: Date.now() 
    };
    storageService.saveSalesReports([newItem, ...items]);
    return newItem;
  },

  updateSale: (id: string, updates: Partial<SalesReport>) => {
    const items = storageService.getSalesReports();
    const index = items.findIndex(i => i._id === id);
    if (index > -1) {
      items[index] = { ...items[index], ...updates };
      storageService.saveSalesReports(items);
    }
  },

  // --- Users (New) ---
  getUsers: (): User[] => {
    const data = localStorage.getItem(KEYS.USERS);
    return data ? JSON.parse(data) : INITIAL_USERS;
  },
  saveUsers: (users: User[]) => localStorage.setItem(KEYS.USERS, JSON.stringify(users)),
  
  addUser: (user: Omit<User, 'id'>) => {
    const items = storageService.getUsers();
    const newItem = { ...user, id: crypto.randomUUID() };
    storageService.saveUsers([newItem, ...items]);
    return newItem;
  },
  updateUser: (id: string, updates: Partial<User>) => {
    const items = storageService.getUsers();
    const index = items.findIndex(i => i.id === id);
    if (index > -1) {
      items[index] = { ...items[index], ...updates };
      storageService.saveUsers(items);
    }
  },
  deleteUser: (id: string) => {
    const items = storageService.getUsers().filter(i => i.id !== id);
    storageService.saveUsers(items);
  }
};