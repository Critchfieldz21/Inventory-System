// API Service for Inventory Tracker
// Base URL for the Django backend
const API_BASE_URL = 'http://localhost:8000/api';

// Normalize paginated (DRF) or plain array responses into a flat array
const toArray = (data) => Array.isArray(data) ? data : (data?.results ?? []);

// ============= AUTH SESSION =============
// Token + username are kept in localStorage so a page reload does not log the
// user out. Reading directly avoids the need for an auth context provider.

const TOKEN_KEY = 'inventory_auth_token';
const USERNAME_KEY = 'inventory_auth_username';

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUsername: () => localStorage.getItem(USERNAME_KEY),
  isAuthenticated: () => Boolean(localStorage.getItem(TOKEN_KEY)),
  setSession: (token, username) => {
    localStorage.setItem(TOKEN_KEY, token);
    if (username) localStorage.setItem(USERNAME_KEY, username);
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
  },
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Helper function for API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;
  const headers = { ...(isFormData ? {} : { 'Content-Type': 'application/json' }) };

  const token = auth.getToken();
  if (token) headers['Authorization'] = `Token ${token}`;
  if (options.headers) Object.assign(headers, options.headers);

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // Token has been revoked or never existed — purge local state so the
    // route guard sends the user back to the login screen.
    auth.clearSession();
  }

  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      detail = body.detail || (typeof body === 'string' ? body : JSON.stringify(body));
    } catch (_) { /* response had no JSON body */ }
    throw new ApiError(detail, response.status);
  }

  if (response.status === 204) return { success: true };
  return response.json();
};

// ============= AUTH API =============

export const authAPI = {
  register: async (credentials) => {
    const data = await apiRequest('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data.token) auth.setSession(data.token, data.username);
    return data;
  },

  login: async (credentials) => {
    const data = await apiRequest('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data.token) auth.setSession(data.token, data.username);
    return data;
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout/', { method: 'POST' });
    } catch (_) {
      // Even if the server call fails (e.g. offline) we still want to drop
      // the local session so the user lands on the login screen.
    } finally {
      auth.clearSession();
    }
  },

  resetPassword: async ({ username, recovery_code, new_password }) => {
    const data = await apiRequest('/auth/reset-password/', {
      method: 'POST',
      body: JSON.stringify({ username, recovery_code, new_password }),
    });
    if (data.token) auth.setSession(data.token, data.username);
    return data;
  },
};

// ============= ITEMS API =============

export const itemsAPI = {
  // Get all items
  getAll: async () => {
    return apiRequest('/items/');
  },

  // Get single item
  getById: async (id) => {
    return apiRequest(`/items/${id}/`);
  },

  // Create new item
  create: async (itemData) => {
    return apiRequest('/items/', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },

  // Update item
  update: async (id, itemData) => {
    return apiRequest(`/items/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  },

  // Partial update
  partialUpdate: async (id, itemData) => {
    return apiRequest(`/items/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(itemData),
    });
  },

  // Delete item
  delete: async (id) => {
    return apiRequest(`/items/${id}/`, {
      method: 'DELETE',
    });
  },

  // Get items by type
  getByType: async (type) => {
    return apiRequest(`/items/by_type/?type=${type}`);
  },

  // Get stock status
  getStockStatus: async (id) => {
    return apiRequest(`/items/${id}/stock_status/`);
  },

  // Get all items with sales information
  getWithSalesInfo: async () => {
    return apiRequest('/items/with_sales_info/');
  },

  importXlsx: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest('/items/import_xlsx/', {
      method: 'POST',
      body: formData,
    });
  },
};

// ============= RECIPES API =============

export const recipesAPI = {
  // Get all recipes
  getAll: async () => {
    return apiRequest('/recipes/');
  },

  // Get single recipe
  getById: async (id) => {
    return apiRequest(`/recipes/${id}/`);
  },

  // Create new recipe
  create: async (recipeData) => {
    return apiRequest('/recipes/', {
      method: 'POST',
      body: JSON.stringify(recipeData),
    });
  },

  // Update recipe
  update: async (id, recipeData) => {
    return apiRequest(`/recipes/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(recipeData),
    });
  },

  // Delete recipe
  delete: async (id) => {
    return apiRequest(`/recipes/${id}/`, {
      method: 'DELETE',
    });
  },

  // Get recipes with components
  getWithComponents: async () => {
    return apiRequest('/recipes/with_components/');
  },

  // Get components for specific recipe
  getComponents: async (id) => {
    return apiRequest(`/recipes/${id}/components/`);
  },

  importXlsx: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest('/recipes/import_xlsx/', {
      method: 'POST',
      body: formData,
    });
  },
};

// ============= TRANSACTIONS/SALES API =============

export const transactionsAPI = {
  // Get all transactions/sales
  getAll: async () => {
    return apiRequest('/sales/');
  },

  // Get all sales
  getSales: async () => {
    return apiRequest('/sales/');
  },

  // Get single transaction
  getById: async (id) => {
    return apiRequest(`/sales/${id}/`);
  },

  // Create new transaction
  create: async (transactionData) => {
    return apiRequest('/sales/', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  },

  // Get sales from today
  getSalesToday: async () => {
    return apiRequest('/sales/today/');
  },

  // Get revenue summary
  getRevenueSummary: async () => {
    return apiRequest('/sales/revenue_summary/');
  },

  // Create a sale
  createSale: async (saleData) => {
    return apiRequest('/sales/', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  },

  // Update sale
  update: async (id, saleData) => {
    return apiRequest(`/sales/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(saleData),
    });
  },

  // Delete transaction
  delete: async (id) => {
    return apiRequest(`/sales/${id}/`, {
      method: 'DELETE',
    });
  },

  importXlsx: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest('/sales/import_xlsx/', {
      method: 'POST',
      body: formData,
    });
  },
};

// ============= EXPENSES API =============
// Records purchase/restock expenses when items are added to inventory

export const expensesAPI = {
  // Get all purchase expenses (most recent first)
  getAll: async () => {
    return apiRequest('/expenses/');
  },

  // Create a new purchase expense
  // Expected shape: { item, quantity, cost_price_at_time, amount, description? }
  create: async (expenseData) => {
    return apiRequest('/expenses/', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  },

  // Get the total sum of all purchase expenses
  getTotal: async () => {
    return apiRequest('/expenses/total/');
  },

  // Get all expenses for a specific item
  getByItem: async (itemId) => {
    return apiRequest(`/expenses/by_item/?item_id=${itemId}`);
  },
};

// ============= ANALYTICS API =============

export const analyticsAPI = {
  // Get dashboard summary
  getDashboardSummary: async () => {
    try {
      const [items, recipes, sales, expenseTotal] = await Promise.all([
        itemsAPI.getAll(),
        recipesAPI.getAll(),
        transactionsAPI.getSales(),
        expensesAPI.getTotal(),
      ]);

      const itemsArray   = toArray(items);
      const recipesArray = toArray(recipes);
      const salesArray   = toArray(sales);

      const completedSales = salesArray.filter(s => s.status === 'Completed');
      const totalRevenue   = completedSales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);
      const totalExpenses  = parseFloat(expenseTotal.total_expenses || 0);

      return {
        total_revenue:  totalRevenue,
        total_expenses: totalExpenses,
        totalItems:     itemsArray.length,
        totalRecipes:   recipesArray.length,
        salesCount:     salesArray.length,
      };
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
  },

  // Get low stock items
  getLowStockItems: async () => {
    try {
      const items = await itemsAPI.getAll();
      return toArray(items).filter(item => item.stock < 10);
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw error;
    }
  },

  // Get sales statistics
  getSalesStats: async () => {
    try {
      const sales      = await transactionsAPI.getSales();
      const salesArray = toArray(sales);
      const today      = new Date().toISOString().split('T')[0];

      const todaysSales = salesArray.filter(sale =>
        sale.transaction_date.split('T')[0] === today
      );

      return {
        totalSales:    salesArray.length,
        todaysSales:   todaysSales.length,
        todaysRevenue: todaysSales.reduce(
          (sum, sale) => sum + (sale.quantity_delta * sale.unit_price), 0
        ),
      };
    } catch (error) {
      console.error('Error fetching sales stats:', error);
      throw error;
    }
  },

  // Get weekly sales data for graph
  getWeeklySalesData: async () => {
    try {
      const sales          = await transactionsAPI.getSales();
      const salesArray     = toArray(sales);
      const daysOfWeek     = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyData     = Object.fromEntries(daysOfWeek.map(d => [d, 0]));

      salesArray
        .filter(s => s.status === 'Completed')
        .forEach(sale => {
          try {
            const day = daysOfWeek[new Date(sale.date).getDay()];
            weeklyData[day] += parseFloat(sale.total || 0);
          } catch (e) { /* skip invalid dates */ }
        });

      return daysOfWeek.map(day => ({
        name:   day,
        profit: parseFloat(weeklyData[day].toFixed(2)),
      }));
    } catch (error) {
      console.error('Error fetching weekly sales data:', error);
      throw error;
    }
  },

  // Get weekly expenses data (purchase costs when items were bought/restocked)
  getWeeklyExpensesData: async () => {
    try {
      const expenses      = await expensesAPI.getAll();
      const expensesArray = toArray(expenses);
      const daysOfWeek    = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyData    = Object.fromEntries(daysOfWeek.map(d => [d, 0]));

      expensesArray.forEach(expense => {
        try {
          const day = daysOfWeek[new Date(expense.date).getDay()];
          weeklyData[day] += parseFloat(expense.amount || 0);
        } catch (e) { /* skip invalid dates */ }
      });

      return daysOfWeek.map(day => ({
        name:     day,
        expenses: parseFloat(weeklyData[day].toFixed(2)),
      }));
    } catch (error) {
      console.error('Error fetching weekly expenses data:', error);
      throw error;
    }
  },

  // Get monthly profit data — revenue minus purchase expenses per calendar day
  getMonthlyExpensesData: async (month, year) => {
    try {
      const now         = new Date();
      const targetMonth = month !== undefined ? month : now.getMonth();
      const targetYear  = year  !== undefined ? year  : now.getFullYear();

      const [salesRaw, expensesRaw] = await Promise.all([
        transactionsAPI.getSales(),
        expensesAPI.getAll(),
      ]);

      const salesArray    = toArray(salesRaw);
      const expensesArray = toArray(expensesRaw);
      const daysInMonth   = new Date(targetYear, targetMonth + 1, 0).getDate();
      const dailyRevenue  = new Array(daysInMonth + 1).fill(0);
      const dailyExpenses = new Array(daysInMonth + 1).fill(0);

      salesArray
        .filter(s => s.status === 'Completed')
        .forEach(sale => {
          try {
            const d = new Date(sale.date);
            if (d.getFullYear() === targetYear && d.getMonth() === targetMonth)
              dailyRevenue[d.getDate()] += parseFloat(sale.total || 0);
          } catch (e) { /* skip bad dates */ }
        });

      expensesArray.forEach(expense => {
        try {
          const d = new Date(expense.date);
          if (d.getFullYear() === targetYear && d.getMonth() === targetMonth)
            dailyExpenses[d.getDate()] += parseFloat(expense.amount || 0);
        } catch (e) { /* skip bad dates */ }
      });

      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        return {
          name:   `${monthNames[targetMonth]} ${day}`,
          profit: parseFloat((dailyRevenue[day] - dailyExpenses[day]).toFixed(2)),
        };
      });
    } catch (error) {
      console.error('Error fetching monthly profit data:', error);
      throw error;
    }
  },

  // Get quarterly data — revenue, expenses, and profit aggregated by week
  getQuarterlyData: async (year) => {
    try {
      const now               = new Date();
      const targetYear        = year !== undefined ? year : now.getFullYear();
      const currentMonth      = now.getMonth();
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      const quarterEndMonth   = quarterStartMonth + 2;
      const startDate         = new Date(targetYear, quarterStartMonth, 1);
      const endDate           = new Date(targetYear, quarterEndMonth + 1, 0);
      const totalDays         = Math.round((endDate - startDate) / 86400000) + 1;
      const numWeeks          = Math.ceil(totalDays / 7);
      const weekRevenue       = new Array(numWeeks).fill(0);
      const weekExpenses      = new Array(numWeeks).fill(0);

      const [salesRaw, expensesRaw] = await Promise.all([
        transactionsAPI.getSales(),
        expensesAPI.getAll(),
      ]);

      toArray(salesRaw)
        .filter(s => s.status === 'Completed')
        .forEach(sale => {
          try {
            const d = new Date(sale.date);
            if (d >= startDate && d <= endDate) {
              const weekIdx = Math.floor(Math.round((d - startDate) / 86400000) / 7);
              weekRevenue[weekIdx] += parseFloat(sale.total || 0);
            }
          } catch (e) { /* skip bad dates */ }
        });

      toArray(expensesRaw).forEach(expense => {
        try {
          const d = new Date(expense.date);
          if (d >= startDate && d <= endDate) {
            const weekIdx = Math.floor(Math.round((d - startDate) / 86400000) / 7);
            weekExpenses[weekIdx] += parseFloat(expense.amount || 0);
          }
        } catch (e) { /* skip bad dates */ }
      });

      const quarterName = `Q${Math.floor(currentMonth / 3) + 1}`;
      const revenue  = [];
      const expenses = [];
      const profit   = [];

      for (let w = 0; w < numWeeks; w++) {
        const name = `${quarterName} Wk ${w + 1}`;
        const rev  = parseFloat(weekRevenue[w].toFixed(2));
        const exp  = parseFloat(weekExpenses[w].toFixed(2));
        revenue.push( { name, revenue:  rev });
        expenses.push({ name, expenses: exp });
        profit.push(  { name, profit:   parseFloat((rev - exp).toFixed(2)) });
      }

      return { profit, expenses, revenue };
    } catch (error) {
      console.error('Error fetching quarterly data:', error);
      throw error;
    }
  },

  // Get monthly revenue series — completed sales revenue per calendar day
  getMonthlyRevenueSeriesData: async (month, year) => {
    try {
      const now         = new Date();
      const targetMonth = month !== undefined ? month : now.getMonth();
      const targetYear  = year  !== undefined ? year  : now.getFullYear();

      const salesArray  = toArray(await transactionsAPI.getSales());
      const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      const dailyRevenue = new Array(daysInMonth + 1).fill(0);

      salesArray
        .filter(s => s.status === 'Completed')
        .forEach(sale => {
          try {
            const d = new Date(sale.date);
            if (d.getFullYear() === targetYear && d.getMonth() === targetMonth)
              dailyRevenue[d.getDate()] += parseFloat(sale.total || 0);
          } catch (e) { /* skip bad dates */ }
        });

      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        return {
          name:    `${monthNames[targetMonth]} ${day}`,
          revenue: parseFloat(dailyRevenue[day].toFixed(2)),
        };
      });
    } catch (error) {
      console.error('Error fetching monthly revenue series data:', error);
      throw error;
    }
  },

  // Get monthly expense series — purchase expenses per calendar day
  getMonthlyExpenseSeriesData: async (month, year) => {
    try {
      const now         = new Date();
      const targetMonth = month !== undefined ? month : now.getMonth();
      const targetYear  = year  !== undefined ? year  : now.getFullYear();

      const expensesArray = toArray(await expensesAPI.getAll());
      const daysInMonth   = new Date(targetYear, targetMonth + 1, 0).getDate();
      const dailyExpenses = new Array(daysInMonth + 1).fill(0);

      expensesArray.forEach(expense => {
        try {
          const d = new Date(expense.date);
          if (d.getFullYear() === targetYear && d.getMonth() === targetMonth)
            dailyExpenses[d.getDate()] += parseFloat(expense.amount || 0);
        } catch (e) { /* skip bad dates */ }
      });

      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        return {
          name:     `${monthNames[targetMonth]} ${day}`,
          expenses: parseFloat(dailyExpenses[day].toFixed(2)),
        };
      });
    } catch (error) {
      console.error('Error fetching monthly expense series data:', error);
      throw error;
    }
  },

  // Get top 3 items sold for a given period ('week' | 'month' | 'quarter' | undefined)
  getTopItemsSold: async (period) => {
    try {
      const sales      = await transactionsAPI.getSales();
      const salesArray = toArray(sales);

      const now = new Date();
      let startDate = null;
      if (period === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (period === 'quarter') {
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      }

      const completedSales = salesArray.filter(s => {
        if (s.status !== 'Completed') return false;
        if (startDate) {
          try { return new Date(s.date) >= startDate; } catch (e) { return false; }
        }
        return true;
      });

      const itemSalesMap = {};
      completedSales.forEach(sale => {
        if (!itemSalesMap[sale.item])
          itemSalesMap[sale.item] = { itemId: sale.item, quantity: 0, itemName: '' };
        itemSalesMap[sale.item].quantity += sale.quantity;
      });

      const itemsArray = toArray(await itemsAPI.getAll());
      Object.values(itemSalesMap).forEach(entry => {
        const item = itemsArray.find(i => i.id === entry.itemId);
        if (item) entry.itemName = item.name;
      });

      return Object.values(itemSalesMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 3);
    } catch (error) {
      console.error('Error fetching top items sold:', error);
      throw error;
    }
  },

  // ── Single-fetch dashboard: replaces 11 individual analytics calls ──────────
  // Fetches items, recipes, sales, and expenses ONCE (4 requests) and
  // derives all data the home dashboard needs, eliminating ~20 redundant calls.
  getDashboardAll: async () => {
    try {
      const now        = new Date();
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const MS_PER_DAY = 86400000;

      const [itemsRaw, , salesRaw, expensesRaw, expenseTotalRaw] = await Promise.all([
        itemsAPI.getAll(),
        recipesAPI.getAll(),
        transactionsAPI.getSales(),
        expensesAPI.getAll(),
        expensesAPI.getTotal(),
      ]);

      const itemsArray    = toArray(itemsRaw);
      const salesArray    = toArray(salesRaw);
      const expensesArray = toArray(expensesRaw);
      const completedSales = salesArray.filter(s => s.status === 'Completed');

      // ── Financial summary ───────────────────────────────────────────
      const totalRevenue  = completedSales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);
      const totalExpenses = parseFloat(expenseTotalRaw.total_expenses || 0);
      const financialData = {
        revenue:  totalRevenue,
        expenses: totalExpenses,
        profit:   totalRevenue - totalExpenses,
      };

      // ── Low stock ───────────────────────────────────────────────────
      const lowStockItems = itemsArray.filter(item => item.stock < 10);

      // ── Rolling daily window helper ─────────────────────────────────
      // Each chart view uses a rolling window ending today so the most
      // recent activity is always visible. Calendar-bound windows (e.g.
      // "this calendar month") render as a flat line whenever the user's
      // data happens to sit in an adjacent month, which was the bug we hit.
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const buildDailyWindow = (windowSize) => {
        const start = new Date(todayStart.getTime() - (windowSize - 1) * MS_PER_DAY);
        const revenue = new Array(windowSize).fill(0);
        const expenses = new Array(windowSize).fill(0);
        const dayIdx = (date) => {
          const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          return Math.round((d.getTime() - start.getTime()) / MS_PER_DAY);
        };
        completedSales.forEach(s => {
          try {
            const i = dayIdx(new Date(s.date));
            if (i >= 0 && i < windowSize) revenue[i] += parseFloat(s.total || 0);
          } catch (_) { /* skip bad date */ }
        });
        expensesArray.forEach(e => {
          try {
            const i = dayIdx(new Date(e.date));
            if (i >= 0 && i < windowSize) expenses[i] += parseFloat(e.amount || 0);
          } catch (_) { /* skip */ }
        });
        const labels = Array.from({ length: windowSize }, (_, i) => {
          const d = new Date(start.getTime() + i * MS_PER_DAY);
          return `${monthNames[d.getMonth()]} ${d.getDate()}`;
        });
        return { revenue, expenses, labels, start };
      };

      const seriesFromWindow = (win, field, valueFn) =>
        win.labels.map((name, i) => ({
          name,
          [field]: parseFloat(valueFn(i).toFixed(2)),
        }));

      // Weekly: rolling last 7 days (7 daily buckets)
      const weekly = buildDailyWindow(7);
      const weeklyRevenueData = seriesFromWindow(weekly, 'revenue',  i => weekly.revenue[i]);
      const weeklyExpenseData = seriesFromWindow(weekly, 'expenses', i => weekly.expenses[i]);
      const weeklyData        = seriesFromWindow(weekly, 'profit',   i => weekly.revenue[i] - weekly.expenses[i]);

      // Monthly: rolling last 30 days (30 daily buckets)
      const monthly = buildDailyWindow(30);
      const monthlyRevenueData = seriesFromWindow(monthly, 'revenue',  i => monthly.revenue[i]);
      const monthlyExpenseData = seriesFromWindow(monthly, 'expenses', i => monthly.expenses[i]);
      const monthlyData        = seriesFromWindow(monthly, 'profit',   i => monthly.revenue[i] - monthly.expenses[i]);

      // Quarterly: rolling last 13 weeks = 91 days, bucketed by week
      const QWEEKS = 13;
      const qDays = QWEEKS * 7;
      const qStart = new Date(todayStart.getTime() - (qDays - 1) * MS_PER_DAY);
      const weekRevenue  = new Array(QWEEKS).fill(0);
      const weekExpenses = new Array(QWEEKS).fill(0);

      const weekBucket = (date) => {
        const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return Math.floor(Math.round((d.getTime() - qStart.getTime()) / MS_PER_DAY) / 7);
      };

      completedSales.forEach(s => {
        try {
          const i = weekBucket(new Date(s.date));
          if (i >= 0 && i < QWEEKS) weekRevenue[i] += parseFloat(s.total || 0);
        } catch (_) { /* skip */ }
      });
      expensesArray.forEach(e => {
        try {
          const i = weekBucket(new Date(e.date));
          if (i >= 0 && i < QWEEKS) weekExpenses[i] += parseFloat(e.amount || 0);
        } catch (_) { /* skip */ }
      });

      const quarterlyData = { profit: [], expenses: [], revenue: [] };
      for (let w = 0; w < QWEEKS; w++) {
        const ws = new Date(qStart.getTime() + w * 7 * MS_PER_DAY);
        const name = `${monthNames[ws.getMonth()]} ${ws.getDate()}`;
        const rev = parseFloat(weekRevenue[w].toFixed(2));
        const exp = parseFloat(weekExpenses[w].toFixed(2));
        quarterlyData.revenue.push( { name, revenue:  rev });
        quarterlyData.expenses.push({ name, expenses: exp });
        quarterlyData.profit.push(  { name, profit:   parseFloat((rev - exp).toFixed(2)) });
      }

      // ── Top items ───────────────────────────────────────────────────
      const getTopItems = (periodStart) => {
        const filtered = completedSales.filter(s => {
          if (!periodStart) return true;
          try { return new Date(s.date) >= periodStart; } catch (_) { return false; }
        });
        const map = {};
        filtered.forEach(sale => {
          if (!map[sale.item]) map[sale.item] = { itemId: sale.item, quantity: 0, itemName: '' };
          map[sale.item].quantity += sale.quantity;
        });
        Object.values(map).forEach(entry => {
          const item = itemsArray.find(i => i.id === entry.itemId);
          if (item) entry.itemName = item.name;
        });
        return Object.values(map).sort((a, b) => b.quantity - a.quantity).slice(0, 3);
      };

      return {
        financialData,
        lowStockItems,
        weeklyData,
        weeklyExpenseData,
        weeklyRevenueData,
        monthlyData,
        monthlyExpenseData,
        monthlyRevenueData,
        quarterlyData,
        weeklyTopItems:    getTopItems(weekly.start),
        monthlyTopItems:   getTopItems(monthly.start),
        quarterlyTopItems: getTopItems(qStart),
      };
    } catch (error) {
      console.error('Error fetching all dashboard data:', error);
      throw error;
    }
  },
};
