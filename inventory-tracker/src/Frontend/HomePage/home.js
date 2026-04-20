import React, { useState, useEffect } from 'react';
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
  const [topItems, setTopItems] = useState([]);
  const [weeklyData, setWeeklyData]   = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [chartView, setChartView]     = useState('week'); // 'week' | 'month'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch all data in parallel
        const [dashboard, lowStock, weeklySales, weeklyExpenses, topItemsSold, monthlyExpenses] = await Promise.all([
          analyticsAPI.getDashboardSummary(),
          analyticsAPI.getLowStockItems(),
          analyticsAPI.getWeeklySalesData(),
          analyticsAPI.getWeeklyExpensesData(),
          analyticsAPI.getTopItemsSold(),
          analyticsAPI.getMonthlyExpensesData(),
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

        // Monthly expense data — one entry per calendar day of the current month
        setMonthlyData(Array.isArray(monthlyExpenses) ? monthlyExpenses : []);
        
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
            <FinancialSummary financialData={financialData} />
            <DashboardChart
              chartView={chartView}
              setChartView={setChartView}
              weeklyData={weeklyData}
              monthlyData={monthlyData}
            />
            <DashboardLists topItems={topItems} lowStockItems={lowStockItems} />
          </>
        )}
      </main>
    </div>
  );
}

export default Home;
