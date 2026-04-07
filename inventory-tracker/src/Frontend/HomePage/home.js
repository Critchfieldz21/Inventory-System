import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsAPI } from '../../api';
import './home.css';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FALLBACK_DATA = DAYS.map(name => ({ name, profit: 0 }));
const NAV_LINKS = [
  { to: '/home', label: 'Home' },
  { to: '/inventory', label: 'Items' },
  { to: '/sales', label: 'Sales' },
  { to: '/recipe', label: 'Recipes' }
];

function Home() {
  const navigate = useNavigate();
  const [financialData, setFinancialData] = useState({ revenue: 0, expenses: 0, profit: 0 });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [weeklyData, setWeeklyData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboard, lowStock, weeklySales, weeklyExpenses, topItemsSold] = await Promise.all([
          analyticsAPI.getDashboardSummary(),
          analyticsAPI.getLowStockItems(),
          analyticsAPI.getWeeklySalesData(),
          analyticsAPI.getWeeklyExpensesData(),
          analyticsAPI.getTopItemsSold()
        ]);
        
        const revenue = dashboard.total_revenue || 0;
        const expenses = dashboard.total_expenses || 0;
        setFinancialData({ revenue, expenses, profit: revenue - expenses });
        setLowStockItems(Array.isArray(lowStock) ? lowStock : lowStock.results || []);
        setTopItems(Array.isArray(topItemsSold) ? topItemsSold : []);
        
        const salesArray = Array.isArray(weeklySales) ? weeklySales : [];
        const expensesArray = Array.isArray(weeklyExpenses) ? weeklyExpenses : [];
        setWeeklyData(salesArray.map(day => ({
          name: day.name,
          profit: parseFloat(((day.profit || 0) - (expensesArray.find(e => e.name === day.name)?.expenses || 0)).toFixed(2))
        })));
      } catch (err) {
        console.error('Dashboard error:', err);
        setError('Failed to load dashboard');
        setFinancialData({ revenue: 0, expenses: 0, profit: 0 });
        setWeeklyData(FALLBACK_DATA);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (val) => `$${parseFloat(val).toFixed(2)}`;

  return (
    <div className="home-layout">
      <aside className="sidebar">
        <h2 className="sidebar-logo">Inventory Tracker</h2>
        <nav className="nav-links">
          {NAV_LINKS.map(link => (
            <Link key={link.to} to={link.to} className={link.label === 'Home' ? 'active' : ''}>
              {link.label}
            </Link>
          ))}
        </nav>
        <button onClick={() => navigate('/')} className="logout-btn">Logout</button>
      </aside>

      <main className="main-content">
        <header className="content-header"><h1>Dashboard Overview</h1></header>
        
        {loading && <div className="loading-message">Loading...</div>}
        {error && <div className="error-message">{error}</div>}
        
        {!loading && !error && (
          <>
            <div className="financial-summary">
              {['revenue', 'expenses', 'profit'].map(key => (
                <div key={key} className={`financial-card ${key}`}>
                  <h4 className="financial-label">Total {key.charAt(0).toUpperCase() + key.slice(1)}</h4>
                  <p className="financial-amount">{formatCurrency(financialData[key])}</p>
                </div>
              ))}
            </div>

            <div className="chart-container">
              <h3 className="card-title">Weekly Profits</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1ba827" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#1ba827" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="profit" stroke="#1ba827" fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bottom-lists-row">
              <div className="status-card">
                <div className="card-header"><h3>Top 3 Items Sold</h3></div>
                <ul className="status-list">
                  {topItems.length ? topItems.map((item, i) => (
                    <li key={i} className="list-item">
                      <span>{i + 1}. {item.itemName}</span>
                      <strong>{item.quantity} sold</strong>
                    </li>
                  )) : <li className="list-item"><span>No sales data</span></li>}
                </ul>
              </div>

              <div className="status-card">
                <div className="card-header"><h3>Low Stock Alerts</h3></div>
                <ul className="status-list">
                  {lowStockItems.length ? lowStockItems.map(item => (
                    <li key={item.id} className="list-item">
                      <span>{item.name}</span>
                      <span className={`stock-tag ${item.stock < 10 ? 'critical' : 'warning'}`}>
                        {item.stock} left
                      </span>
                    </li>
                  )) : <li className="list-item"><span>No low stock items</span></li>}
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
