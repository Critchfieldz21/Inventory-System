import React, { useState, useEffect } from 'react';import { useNavigate, Link } from 'react-router-dom';
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
        // Fetch all data in parallel
        const [dashboard, lowStock, weeklySales, weeklyExpenses, topWeek, topMonth, topQuarter, monthlyExpenses, monthlyExpenseSeries, monthlyRevenueSeries, quarterlyRaw] = await Promise.all([
          analyticsAPI.getDashboardSummary(),
          analyticsAPI.getLowStockItems(),
          analyticsAPI.getWeeklySalesData(),
          analyticsAPI.getWeeklyExpensesData(),
          analyticsAPI.getTopItemsSold('week'),
          analyticsAPI.getTopItemsSold('month'),
          analyticsAPI.getTopItemsSold('quarter'),
          analyticsAPI.getMonthlyExpensesData(),
          analyticsAPI.getMonthlyExpenseSeriesData(),
          analyticsAPI.getMonthlyRevenueSeriesData(),
          analyticsAPI.getQuarterlyData(),
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
        
        // Set top items sold per period
        setWeeklyTopItems(Array.isArray(topWeek) ? topWeek : []);
        setMonthlyTopItems(Array.isArray(topMonth) ? topMonth : []);
        setQuarterlyTopItems(Array.isArray(topQuarter) ? topQuarter : []);
        
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
        
        // Store raw weekly expense data for the expense chart view
        setWeeklyExpenseData(weeklyExpenseData);

        // Build weekly revenue series from weeklySales (rename 'profit' field to 'revenue')
        setWeeklyRevenueData(weeklyRevenue.map(d => ({ name: d.name, revenue: parseFloat(d.profit || 0) })));

        setWeeklyData(profitByDay || [
          { name: 'Sun', profit: 0 },
          { name: 'Mon', profit: 0 },
          { name: 'Tue', profit: 0 },
          { name: 'Wed', profit: 0 },
          { name: 'Thu', profit: 0 },
          { name: 'Fri', profit: 0 },
          { name: 'Sat', profit: 0 },
        ]);

        // Monthly profit data (revenue - expenses per day)
        setMonthlyData(Array.isArray(monthlyExpenses) ? monthlyExpenses : []);
        // Monthly expense-only series
        setMonthlyExpenseData(Array.isArray(monthlyExpenseSeries) ? monthlyExpenseSeries : []);
        // Monthly revenue-only series
        setMonthlyRevenueData(Array.isArray(monthlyRevenueSeries) ? monthlyRevenueSeries : []);

        // Quarterly data (profit, expenses, revenue by week within current quarter)
        setQuarterlyData(quarterlyRaw && typeof quarterlyRaw === 'object' ? quarterlyRaw : { profit: [], expenses: [], revenue: [] });
        
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
              topItems={
                chartView === 'month'   ? monthlyTopItems :
                chartView === 'quarter' ? quarterlyTopItems :
                weeklyTopItems
              }
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
