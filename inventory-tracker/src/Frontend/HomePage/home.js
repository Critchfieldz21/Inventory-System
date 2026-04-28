import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { analyticsAPI } from '../../api';
import FinancialSummary from './FinancialSummary';
import DashboardChart from './DashboardChart';
import DashboardLists from './DashboardLists';
import './home.css';
import './Sidebar.css';
import './FinancialSummary.css';
import './DashboardChart.css';
import './DashboardLists.css';

function Home() {
  const navigate = useNavigate();
  const [financialData, setFinancialData] = useState({ revenue: 0, expenses: 0, profit: 0 });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [weeklyTopItems, setWeeklyTopItems]       = useState([]);
  const [monthlyTopItems, setMonthlyTopItems]     = useState([]);
  const [quarterlyTopItems, setQuarterlyTopItems] = useState([]);
  const [weeklyData, setWeeklyData]                   = useState([]);
  const [weeklyExpenseData, setWeeklyExpenseData]     = useState([]);
  const [weeklyRevenueData, setWeeklyRevenueData]     = useState([]);
  const [monthlyData, setMonthlyData]                 = useState([]);
  const [monthlyExpenseData, setMonthlyExpenseData]   = useState([]);
  const [monthlyRevenueData, setMonthlyRevenueData]   = useState([]);
  const [quarterlyData, setQuarterlyData]             = useState({ profit: [], expenses: [], revenue: [] });
  const [chartView, setChartView]                     = useState('week');
  const [chartMetric, setChartMetric]                 = useState('profit');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Single call — fetches items/recipes/sales/expenses once, processes everything
        const data = await analyticsAPI.getDashboardAll();

        setFinancialData(data.financialData);
        setLowStockItems(data.lowStockItems);
        setWeeklyTopItems(data.weeklyTopItems);
        setMonthlyTopItems(data.monthlyTopItems);
        setQuarterlyTopItems(data.quarterlyTopItems);
        setWeeklyData(data.weeklyData);
        setWeeklyExpenseData(data.weeklyExpenseData);
        setWeeklyRevenueData(data.weeklyRevenueData);
        setMonthlyData(data.monthlyData);
        setMonthlyExpenseData(data.monthlyExpenseData);
        setMonthlyRevenueData(data.monthlyRevenueData);
        setQuarterlyData(data.quarterlyData);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        // Use fallback data
        setFinancialData({ revenue: 0, expenses: 0, profit: 0 });
        setWeeklyTopItems([]);
        setMonthlyTopItems([]);
        setQuarterlyTopItems([]);
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

  // Derive active top-items list from chartView — memoized to avoid work on every render
  const activeTopItems = useMemo(() => (
    chartView === 'month'   ? monthlyTopItems   :
    chartView === 'quarter' ? quarterlyTopItems :
    weeklyTopItems
  ), [chartView, weeklyTopItems, monthlyTopItems, quarterlyTopItems]);

  return (
    <div className={`home-layout${sidebarOpen ? ' sidebar-open' : ''}`}>
      {/* --- Hamburger Button --- */}
      <button
        className={`hamburger-btn${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(o => !o)}
        aria-label="Toggle sidebar"
      >
        <span /><span /><span />
      </button>

      {/* --- Overlay --- */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* --- Sidebar Navigation --- */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <h2 className="sidebar-logo">Inventory Tracker</h2>
        <nav className="nav-links">
          <Link to="/home" className="active" onClick={() => setSidebarOpen(false)}>Home</Link>
          <Link to="/inventory" onClick={() => setSidebarOpen(false)}>Inventory</Link>
          <Link to="/sales" onClick={() => setSidebarOpen(false)}>Sales</Link>
          <Link to="/recipe" onClick={() => setSidebarOpen(false)}>Recipes</Link>
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
            <FinancialSummary financialData={financialData} />
            <DashboardChart
              chartView={chartView}
              setChartView={setChartView}
              chartMetric={chartMetric}
              setChartMetric={setChartMetric}
              weeklyData={weeklyData}
              weeklyExpenseData={weeklyExpenseData}
              weeklyRevenueData={weeklyRevenueData}
              monthlyData={monthlyData}
              monthlyExpenseData={monthlyExpenseData}
              monthlyRevenueData={monthlyRevenueData}
              quarterlyData={quarterlyData}
            />
            <DashboardLists
              topItems={activeTopItems}
              lowStockItems={lowStockItems}
              chartView={chartView}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default Home;
