// API Service for Inventory Tracker
// Base URL for the Django backend
const API_BASE_URL = 'http://localhost:8000/api';

// Helper function for API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;
  const defaultHeaders = isFormData ? {} : { 'Content-Type': 'application/json' };
  const defaultOptions = {
    headers: defaultHeaders,
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    // Handle 204 No Content (successful DELETE)
    if (response.status === 204) {
      return { success: true };
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
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

      // Handle both paginated and direct array responses
      const itemsArray = Array.isArray(items) ? items : (items.results || []);
      const recipesArray = Array.isArray(recipes) ? recipes : (recipes.results || []);
      const salesArray = Array.isArray(sales) ? sales : (sales.results || []);

      // Calculate total revenue from completed sales
      const completedSales = salesArray.filter(s => s.status === 'Completed');
      const totalRevenue = completedSales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);

      // Total expenses = sum of all recorded purchase expenses (cost_price × quantity when buying stock)
      const totalExpenses = parseFloat(expenseTotal.total_expenses || 0);

      return {
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        totalItems: itemsArray.length,
        totalRecipes: recipesArray.length,
        salesCount: salesArray.length,
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
      // Handle both paginated and direct array responses
      const itemsArray = Array.isArray(items) ? items : (items.results || []);
      return itemsArray.filter(item => item.stock < 10);
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw error;
    }
  },

  // Get sales statistics
  getSalesStats: async () => {
    try {
      const sales = await transactionsAPI.getSales();
      // Handle both paginated and direct array responses
      const salesArray = Array.isArray(sales) ? sales : (sales.results || []);
      const today = new Date().toISOString().split('T')[0];
      
      const todaysSales = salesArray.filter(sale => 
        sale.transaction_date.split('T')[0] === today
      );

      return {
        totalSales: salesArray.length,
        todaysSales: todaysSales.length,
        todaysRevenue: todaysSales.reduce(
          (sum, sale) => sum + (sale.quantity_delta * sale.unit_price),
          0
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
      const sales = await transactionsAPI.getSales();
      // Handle both paginated and direct array responses
      const salesArray = Array.isArray(sales) ? sales : (sales.results || []);
      
      // Get completed sales only
      const completedSales = salesArray.filter(s => s.status === 'Completed');
      
      // Create a map of days of the week
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyData = {};
      
      // Initialize all days with 0 profit
      daysOfWeek.forEach(day => {
        weeklyData[day] = 0;
      });
      
      // Calculate profit for each day
      completedSales.forEach(sale => {
        try {
          const saleDate = new Date(sale.date);
          const dayName = daysOfWeek[saleDate.getDay()];
          weeklyData[dayName] += parseFloat(sale.total || 0);
        } catch (e) {
          // Skip sales with invalid dates
        }
      });
      
      // Format for chart
      return daysOfWeek.map(day => ({
        name: day,
        profit: parseFloat(weeklyData[day].toFixed(2))
      }));
    } catch (error) {
      console.error('Error fetching weekly sales data:', error);
      throw error;
    }
  },

  // Get weekly expenses data (purchase costs when items were bought/restocked)
  getWeeklyExpensesData: async () => {
    try {
      const expenses = await expensesAPI.getAll();
      const expensesArray = Array.isArray(expenses) ? expenses : (expenses.results || []);

      // Create a map of days of the week
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyData = {};

      // Initialize all days with 0 expenses
      daysOfWeek.forEach(day => { weeklyData[day] = 0; });

      // Sum expenses by day of week
      expensesArray.forEach(expense => {
        try {
          const expDate = new Date(expense.date);
          const dayName = daysOfWeek[expDate.getDay()];
          weeklyData[dayName] += parseFloat(expense.amount || 0);
        } catch (e) {
          // Skip entries with invalid dates
        }
      });

      // Format for chart
      return daysOfWeek.map(day => ({
        name: day,
        expenses: parseFloat(weeklyData[day].toFixed(2))
      }));
    } catch (error) {
      console.error('Error fetching weekly expenses data:', error);
      throw error;
    }
  },

  // Get monthly profit data — revenue minus purchase expenses per calendar day
  // month: 0-based JS month (default = current month), year: full year (default = current year)
  getMonthlyExpensesData: async (month, year) => {
    try {
      const now = new Date();
      const targetMonth = month !== undefined ? month : now.getMonth();
      const targetYear  = year  !== undefined ? year  : now.getFullYear();

      // Fetch sales and purchase expenses in parallel
      const [salesRaw, expensesRaw] = await Promise.all([
        transactionsAPI.getSales(),
        expensesAPI.getAll(),
      ]);

      const salesArray    = Array.isArray(salesRaw)    ? salesRaw    : (salesRaw.results    || []);
      const expensesArray = Array.isArray(expensesRaw) ? expensesRaw : (expensesRaw.results || []);

      // How many days are in the target month?
      const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

      // Zero-filled maps keyed by day-of-month (1 … daysInMonth)
      const dailyRevenue  = {};
      const dailyExpenses = {};
      for (let d = 1; d <= daysInMonth; d++) {
        dailyRevenue[d]  = 0;
        dailyExpenses[d] = 0;
      }

      // Accumulate completed sales revenue by day
      salesArray
        .filter(s => s.status === 'Completed')
        .forEach(sale => {
          try {
            const d = new Date(sale.date);
            if (d.getFullYear() === targetYear && d.getMonth() === targetMonth) {
              dailyRevenue[d.getDate()] += parseFloat(sale.total || 0);
            }
          } catch (e) { /* skip bad dates */ }
        });

      // Accumulate purchase expenses by day
      expensesArray.forEach(expense => {
        try {
          const d = new Date(expense.date);
          if (d.getFullYear() === targetYear && d.getMonth() === targetMonth) {
            dailyExpenses[d.getDate()] += parseFloat(expense.amount || 0);
          }
        } catch (e) { /* skip bad dates */ }
      });

      // Return profit (revenue - expenses) per day
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
  // within the current calendar quarter (Q1=Jan-Mar, Q2=Apr-Jun, Q3=Jul-Sep, Q4=Oct-Dec).
  // Returns { profit: [], expenses: [], revenue: [] } each as Array<{name:'Wk N', value}>
  getQuarterlyData: async (year) => {
    try {
      const now          = new Date();
      const targetYear   = year !== undefined ? year : now.getFullYear();
      const currentMonth = now.getMonth(); // 0-based

      // Determine current quarter's start month (0-based)
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3; // 0, 3, 6, or 9
      const quarterEndMonth   = quarterStartMonth + 2;             // inclusive

      // Build a list of all days in the quarter
      const startDate = new Date(targetYear, quarterStartMonth, 1);
      const endDate   = new Date(targetYear, quarterEndMonth + 1, 0); // last day of last month

      // Fetch sales and expenses in parallel
      const [salesRaw, expensesRaw] = await Promise.all([
        transactionsAPI.getSales(),
        expensesAPI.getAll(),
      ]);
      const salesArray    = Array.isArray(salesRaw)    ? salesRaw    : (salesRaw.results    || []);
      const expensesArray = Array.isArray(expensesRaw) ? expensesRaw : (expensesRaw.results || []);

      // Total days in quarter
      const totalDays = Math.round((endDate - startDate) / 86400000) + 1;
      // ~13 weeks — bucket each day into a week index (0-based)
      const numWeeks  = Math.ceil(totalDays / 7);

      const weekRevenue  = new Array(numWeeks).fill(0);
      const weekExpenses = new Array(numWeeks).fill(0);

      // Accumulate sales revenue by quarter-week
      salesArray
        .filter(s => s.status === 'Completed')
        .forEach(sale => {
          try {
            const d = new Date(sale.date);
            if (d >= startDate && d <= endDate) {
              const dayOffset = Math.round((d - startDate) / 86400000);
              const weekIdx   = Math.floor(dayOffset / 7);
              weekRevenue[weekIdx] += parseFloat(sale.total || 0);
            }
          } catch (e) { /* skip bad dates */ }
        });

      // Accumulate purchase expenses by quarter-week
      expensesArray.forEach(expense => {
        try {
          const d = new Date(expense.date);
          if (d >= startDate && d <= endDate) {
            const dayOffset = Math.round((d - startDate) / 86400000);
            const weekIdx   = Math.floor(dayOffset / 7);
            weekExpenses[weekIdx] += parseFloat(expense.amount || 0);
          }
        } catch (e) { /* skip bad dates */ }
      });

      // Build the three series arrays
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
      const now = new Date();
      const targetMonth = month !== undefined ? month : now.getMonth();
      const targetYear  = year  !== undefined ? year  : now.getFullYear();

      const salesRaw = await transactionsAPI.getSales();
      const salesArray = Array.isArray(salesRaw) ? salesRaw : (salesRaw.results || []);

      const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      const dailyRevenue = {};
      for (let d = 1; d <= daysInMonth; d++) dailyRevenue[d] = 0;

      salesArray
        .filter(s => s.status === 'Completed')
        .forEach(sale => {
          try {
            const d = new Date(sale.date);
            if (d.getFullYear() === targetYear && d.getMonth() === targetMonth) {
              dailyRevenue[d.getDate()] += parseFloat(sale.total || 0);
            }
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

  // Get monthly expense series — purchase expenses per calendar day (not profit)
  // month: 0-based JS month (default = current month), year: full year (default = current year)
  getMonthlyExpenseSeriesData: async (month, year) => {
    try {
      const now = new Date();
      const targetMonth = month !== undefined ? month : now.getMonth();
      const targetYear  = year  !== undefined ? year  : now.getFullYear();

      const expensesRaw = await expensesAPI.getAll();
      const expensesArray = Array.isArray(expensesRaw) ? expensesRaw : (expensesRaw.results || []);

      const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      const dailyExpenses = {};
      for (let d = 1; d <= daysInMonth; d++) dailyExpenses[d] = 0;

      expensesArray.forEach(expense => {
        try {
          const d = new Date(expense.date);
          if (d.getFullYear() === targetYear && d.getMonth() === targetMonth) {
            dailyExpenses[d.getDate()] += parseFloat(expense.amount || 0);
          }
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

  // Get top 3 items sold
  // period: 'week' | 'month' | 'quarter' | undefined (all-time)
  getTopItemsSold: async (period) => {
    try {
      const sales = await transactionsAPI.getSales();
      // Handle both paginated and direct array responses
      const salesArray = Array.isArray(sales) ? sales : (sales.results || []);

      // Build date filter based on period
      const now = new Date();
      let startDate = null;
      if (period === 'week') {
        // Start of the current week (Sunday)
        const day = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (period === 'quarter') {
        const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), qStartMonth, 1);
      }

      // Get completed sales only, filtered by period if specified
      const completedSales = salesArray.filter(s => {
        if (s.status !== 'Completed') return false;
        if (startDate) {
          try { return new Date(s.date) >= startDate; } catch (e) { return false; }
        }
        return true;
      });
      
      // Count quantity sold per item
      const itemSalesMap = {};
      completedSales.forEach(sale => {
        if (!itemSalesMap[sale.item]) {
          itemSalesMap[sale.item] = {
            itemId: sale.item,
            quantity: 0,
            itemName: ''
          };
        }
        itemSalesMap[sale.item].quantity += sale.quantity;
      });
      
      // Get item names from items API
      const items = await itemsAPI.getAll();
      const itemsArray = Array.isArray(items) ? items : (items.results || []);
      
      // Add item names to sales data
      Object.values(itemSalesMap).forEach(sale => {
        const item = itemsArray.find(i => i.id === sale.itemId);
        if (item) {
          sale.itemName = item.name;
        }
      });
      
      // Sort by quantity sold and get top 3
      const topItems = Object.values(itemSalesMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 3);
      
      return topItems;
    } catch (error) {
      console.error('Error fetching top items sold:', error);
      throw error;
    }
  },
};
