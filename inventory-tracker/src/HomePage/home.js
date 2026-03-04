import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import './home.css';

const weeklyData = [
  { name: 'Mon', sales: 4000 },
  { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 2000 },
  { name: 'Thu', sales: 2780 },
  { name: 'Fri', sales: 1890 },
  { name: 'Sat', sales: 2390 },
  { name: 'Sun', sales: 3490 },
];

function Home() {
  const navigate = useNavigate();

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
          <p>Inventory performance over the last 7 days.</p>
        </header>

        {/* --- Top Section: Trend Graph --- */}
        <div className="chart-container">
          <h3 className="card-title">Weekly Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#4f46e5" 
                fillOpacity={1} 
                fill="url(#colorSales)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* --- Bottom Section: Lists Row --- */}
        <div className="bottom-lists-row">
          
          {/* Top 5 Items List */}
          <div className="status-card">
            <div className="card-header">
              <h3>Top 5 Items Sold</h3>
            </div>
            <ul className="status-list">
              <li className="list-item"><span>1. Burger Buns</span> <strong>420 sold</strong></li>
              <li className="list-item"><span>2. Beef Patties</span> <strong>385 sold</strong></li>
              <li className="list-item"><span>3. Cheddar Cheese</span> <strong>310 sold</strong></li>
              <li className="list-item"><span>4. French Fries</span> <strong>290 sold</strong></li>
              <li className="list-item"><span>5. Coca Cola</span> <strong>215 sold</strong></li>
            </ul>
          </div>

          {/* Low Stock Items List */}
          <div className="status-card">
            <div className="card-header">
              <h3>Low Stock Alerts</h3>
            </div>
            <ul className="status-list">
              <li className="list-item">
                <span>Onions</span> 
                <span className="stock-tag critical">5 left</span>
              </li>
              <li className="list-item">
                <span>Tomatoes</span> 
                <span className="stock-tag warning">12 left</span>
              </li>
              <li className="list-item">
                <span>Pickles</span> 
                <span className="stock-tag warning">18 left</span>
              </li>
              <li className="list-item">
                <span>Mayonnaise</span> 
                <span className="stock-tag warning">20 left</span>
              </li>
              <li className="list-item">
                <span>Lettuce</span> 
                <span className="stock-tag warning">22 left</span>
              </li>
            </ul>
          </div>

        </div>
      </main>
    </div>
  );
}

export default Home;
