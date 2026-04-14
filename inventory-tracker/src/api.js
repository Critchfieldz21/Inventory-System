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

// ============= ANALYTICS API =============

export const analyticsAPI = {
  // Get dashboard summary
  getDashboardSummary: async () => {
    try {
      const [items, recipes, sales] = await Promise.all([
        itemsAPI.getAll(),
        recipesAPI.getAll(),
        transactionsAPI.getSales(),
      ]);

      // Handle both paginated and direct array responses
      const itemsArray = Array.isArray(items) ? items : (items.results || []);
      const recipesArray = Array.isArray(recipes) ? recipes : (recipes.results || []);
      const salesArray = Array.isArray(sales) ? sales : (sales.results || []);

      // Calculate total revenue from completed sales
      const completedSales = salesArray.filter(s => s.status === 'Completed');
      const totalRevenue = completedSales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);
      
      // Calculate total expenses based on cost price of items sold
      const totalExpenses = completedSales.reduce((sum, sale) => {
        // Find the item for this sale
        const item = itemsArray.find(i => i.id === sale.item);
        if (item) {
          const costPerUnit = parseFloat(item.cost_price || 0);
          const totalCost = costPerUnit * sale.quantity;
          return sum + totalCost;
        }
        return sum;
      }, 0);
      
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

  // Get weekly expenses data (cost of goods sold)
  getWeeklyExpensesData: async () => {
    try {
      const [sales, items] = await Promise.all([
        transactionsAPI.getSales(),
        itemsAPI.getAll(),
      ]);
      
      // Handle both paginated and direct array responses
      const salesArray = Array.isArray(sales) ? sales : (sales.results || []);
      const itemsArray = Array.isArray(items) ? items : (items.results || []);
      
      // Get completed sales only
      const completedSales = salesArray.filter(s => s.status === 'Completed');
      
      // Create a map of days of the week
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyData = {};
      
      // Initialize all days with 0 expenses
      daysOfWeek.forEach(day => {
        weeklyData[day] = 0;
      });
      
      // Calculate expenses for each day based on cost price
      completedSales.forEach(sale => {
        try {
          const saleDate = new Date(sale.date);
          const dayName = daysOfWeek[saleDate.getDay()];
          const item = itemsArray.find(i => i.id === sale.item);
          if (item) {
            const costPerUnit = parseFloat(item.cost_price || 0);
            const totalCost = costPerUnit * sale.quantity;
            weeklyData[dayName] += totalCost;
          }
        } catch (e) {
          // Skip sales with invalid dates
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

  // Get top 3 items sold
  getTopItemsSold: async () => {
    try {
      const sales = await transactionsAPI.getSales();
      // Handle both paginated and direct array responses
      const salesArray = Array.isArray(sales) ? sales : (sales.results || []);
      
      // Get completed sales only
      const completedSales = salesArray.filter(s => s.status === 'Completed');
      
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
