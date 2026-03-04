import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './items.css';

function Items() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Sample Inventory Data
  const inventory = [
    { id: 1, name: 'Burger Buns', category: 'Bakery', stock: 420, price: '$0.50' },
    { id: 2, name: 'Beef Patties', category: 'Meat', stock: 385, price: '$2.10' },
    { id: 3, name: 'Cheddar Cheese', category: 'Dairy', stock: 12, price: '$1.05' },
    { id: 4, name: 'Onions', category: 'Produce', stock: 5, price: '$0.20' },
  ];

  return (
    <div className="home-layout">
      {/* Sidebar - Keep this consistent across pages */}
      <aside className="sidebar">
        <h2 className="sidebar-logo">Inventory Tracker</h2>
        <nav className="nav-links">
          <Link to="/home">Home</Link>
          <Link to="/inventory" className="active">Items</Link>
          <Link to="/sales">Sales</Link>
          <Link to="/recipe">Recipes</Link>
        </nav>
        <button onClick={() => navigate('/')} className="logout-btn">Logout</button>
      </aside>

      <main className="main-content">
        <header className="content-header item-header">
          <div>
            <h1>Inventory Items</h1>
          </div>
        </header>

        <div className="table-container">
          <div className="table-controls">
            <input 
              type="text" 
              placeholder="Search items..." 
              className="search-bar"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <table className="inventory-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory
                .filter((item) => 
                  item.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>{item.stock}</td>
                    <td>{item.price}</td>
                    <td>
                      <span className={`stock-tag ${item.stock < 10 ? 'critical' : item.stock < 20 ? 'warning' : 'healthy'}`}>
                        {item.stock < 10 ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default Items;
