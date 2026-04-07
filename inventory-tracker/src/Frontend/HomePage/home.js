import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsAPI } from '../../api';
import './home.css';

function Home() {
  const navigate = useNavigate();
  const [financialData, setFinancialData] = useState({ revenue: 0, expenses: 0, profit: 0 });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch all data in parallel
        const [dashboard, lowStock, weeklySales, weeklyExpenses, topItemsSold] = await Promise.all([
          analyticsAPI.getDashboardSummary(),
          analyticsAPI.getLowStockItems(),
          analyticsAPI.getWeeklySalesData(),
          analyticsAPI.getWeeklyExpensesData(),
          analyticsAPI.getTopItemsSold()
        ]);
        
        const revenue = dashboard.total_revenue || 0;
        const expenses = dashboard.total_expenses || 0;
        const profit = revenue - expenses;
        
        setFinancialData({
          revenue: revenue,
          expenses: expenses,
          profit: profit
        });
        
        // Handle both paginated (object with results) and direct array responses
        const lowStockArray = Array.isArray(lowStock) ? lowStock : (lowStock.results || []);
        setLowStockItems(lowStockArray || []);
        
        // Set top items sold
        const topItemsArray = Array.isArray(topItemsSold) ? topItemsSold : [];
        setTopItems(topItemsArray);
        
        // Calculate profit for each day (revenue - expenses)
        const weeklyRevenue = Array.isArray(weeklySales) ? weeklySales : (weeklySales || []);
        const weeklyExpenseData = Array.isArray(weeklyExpenses) ? weeklyExpenses : (weeklyExpenses || []);
        
        const profitByDay = weeklyRevenue.map(dayData => {
          const dayExpenses = weeklyExpenseData.find(exp => exp.name === dayData.name);
          const dailyExpense = dayExpenses ? parseFloat(dayExpenses.expenses || 0) : 0;
          const dailyRevenue = parseFloat(dayData.profit || 0);
          return {
            name: dayData.name,
            profit: parseFloat((dailyRevenue - dailyExpense).toFixed(2))
          };
        });
        
        setWeeklyData(profitByDay || [
          { name: 'Sun', profit: 0 },
          { name: 'Mon', profit: 0 },
          { name: 'Tue', profit: 0 },
          { name: 'Wed', profit: 0 },
          { name: 'Thu', profit: 0 },
          { name: 'Fri', profit: 0 },
          { name: 'Sat', profit: 0 },
        ]);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        // Use fallback data
        setFinancialData({ revenue: 0, expenses: 0, profit: 0 });
        setTopItems([]);
        setWeeklyData([
          { name: 'Sun', profit: 0 },
          { name: 'Mon', profit: 0 },
          { name: 'Tue', profit: 0 },
          { name: 'Wed', profit: 0 },
          { name: 'Thu', profit: 0 },
          { name: 'Fri', profit: 0 },
          { name: 'Sat', profit: 0 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="home-layout">
      {/* --- Sidebar Navigation --- */}
      <aside className="sidebar">
        <h2 className="sidebar-logo">Inventory Tracker</h2>
        <nav className="nav-links">
          <Link to="/home" className="active">Home</Link>
          <Link to="/inventory">Items</Link>
          <Link to="/sales">Sales</Link>
          <Link to="/recipe">Recipes</Link>
        </nav>
        <button onClick={() => navigate('/')} className="logout-btn">Logout</button>
      </aside>

      {/* --- Main Dashboard Content --- */}
      <main className="main-content">
        <header className="content-header">
          <h1>Dashboard Overview</h1>
        </header>

        {/* --- Financial Summary Section --- */}
        {loading ? (
          <div className="loading-message">Loading dashboard...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            <div className="financial-summary">
              <div className="financial-card revenue">
                <h4 className="financial-label">Total Revenue</h4>
                <p className="financial-amount">${parseFloat(financialData.revenue).toFixed(2)}</p>
              </div>
              <div className="financial-card expenses">
                <h4 className="financial-label">Total Expenses</h4>
                <p className="financial-amount">${parseFloat(financialData.expenses).toFixed(2)}</p>
              </div>
              <div className="financial-card profit">
                <h4 className="financial-label">Total Profit</h4>
                <p className="financial-amount">${parseFloat(financialData.profit).toFixed(2)}</p>
              </div>
            </div>

            {/* --- Top Section: Trend Graph --- */}
            <div className="chart-container">
              <h3 className="card-title">Weekly Profits </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1ba827" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1ba827" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#1ba827" 
                    fillOpacity={1} 
                    fill="url(#colorProfit)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* --- Bottom Section: Lists Row --- */}
            <div className="bottom-lists-row">
              
              {/* Top 3 Items List */}
              <div className="status-card">
                <div className="card-header">
                  <h3>Top 3 Items Sold</h3>
                </div>
                <ul className="status-list">
                  {topItems.length > 0 ? (
                    topItems.map((item, index) => (
                      <li key={index} className="list-item">
                        <span>{index + 1}. {item.itemName}</span> 
                        <strong>{item.quantity} sold</strong>
                      </li>
                    ))
                  ) : (
                    <li className="list-item">
                      <span>No sales data available</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Low Stock Items List */}
              <div className="status-card">
                <div className="card-header">
                  <h3>Low Stock Alerts</h3>
                </div>
                <ul className="status-list">
                  {lowStockItems.length > 0 ? (
                    lowStockItems.map((item, index) => (
                      <li key={item.id} className="list-item">
                        <span>{item.name}</span> 
                        <span className={`stock-tag ${item.stock < 10 ? 'critical' : 'warning'}`}>
                          {item.stock} left
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="list-item">
                      <span>No low stock items</span>
                    </li>
                  )}
                </ul>
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Home;
