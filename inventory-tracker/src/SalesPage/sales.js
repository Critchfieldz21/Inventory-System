import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './sales.css'; // You can reuse most of items.css logic

function Sales() {
  const navigate = useNavigate();
  const salesData = [
    { id: 'TX101', item: 'Double Burger', date: '2024-03-04', total: '$12.50', status: 'Completed' },
    { id: 'TX102', item: 'Cheese Fries', date: '2024-03-04', total: '$6.00', status: 'Completed' },
  ];

  return (
    <div className="home-layout">
      <aside className="sidebar">
        <h2 className="sidebar-logo">Inventory Tracker</h2>
        <nav className="nav-links">
          <Link to="/home">Home</Link>
          <Link to="/inventory">Items</Link>
          <Link to="/sales" className="active">Sales</Link>
          <Link to="/recipe">Recipes</Link>
        </nav>
        <button onClick={() => navigate('/')} className="logout-btn">Logout</button>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <h1>Sales History</h1>
        </header>
        <div className="table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Item</th>
                <th>Date</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map(sale => (
                <tr key={sale.id}>
                  <td>{sale.id}</td>
                  <td>{sale.item}</td>
                  <td>{sale.date}</td>
                  <td>{sale.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default Sales;
