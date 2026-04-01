import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './items.css';

const INVENTORY_STORAGE_KEY = 'inventory_items';

function Items() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [inventory, setInventory] = useState(() => {
    const savedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);

    if (!savedInventory) {
      return [];
    }

    try {
      return JSON.parse(savedInventory);
    } catch (error) {
      return [];
    }
  });

  const [selectedRow, setSelectedRow] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    stock: '',
    price: ''
  });

  useEffect(() => {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
  }, [inventory]);

  const handleAddClick = () => {
    setFormData({ name: '', category: '', stock: '', price: '' });
    setShowAddModal(true);
  };

  const handleRemoveClick = () => {
    if (selectedRow !== null) {
      setShowRemoveModal(true);
    } else {
      alert('Please select an item to remove');
    }
  };

  const handleConfirmAdd = () => {
    if (formData.name && formData.category && formData.stock && formData.price) {
      const newItem = {
        id: Math.max(...inventory.map(i => i.id), 0) + 1,
        name: formData.name,
        category: formData.category,
        stock: parseInt(formData.stock),
        price: formData.price.startsWith('$') ? formData.price : `$${formData.price}`
      };
      setInventory([...inventory, newItem]);
      setShowAddModal(false);
    }
  };

  const handleConfirmRemove = () => {
    setInventory(inventory.filter((_, index) => index !== selectedRow));
    setShowRemoveModal(false);
    setSelectedRow(null);
  };

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
            <button className="action-btn add-btn" onClick={handleAddClick}>Add</button>
            <button className="action-btn remove-btn" onClick={handleRemoveClick}>Remove</button>
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
                .map((item, index) => (
                  <tr 
                    key={item.id}
                    onClick={() => setSelectedRow(index)}
                    className={selectedRow === index ? 'selected-row' : ''}
                  >
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

        {/* Add Item Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Add New Item</h2>
              <div className="form-group">
                <label>Item Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter item name"
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input 
                  type="text" 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="Enter category"
                />
              </div>
              <div className="form-group">
                <label>Stock</label>
                <input 
                  type="number" 
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  placeholder="Enter stock quantity"
                />
              </div>
              <div className="form-group">
                <label>Price</label>
                <input 
                  type="text" 
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="Enter price"
                />
              </div>
              <div className="modal-buttons">
                <button className="btn-confirm" onClick={handleConfirmAdd}>Add Item</button>
                <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Item Modal */}
        {showRemoveModal && (
          <div className="modal-overlay" onClick={() => setShowRemoveModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Confirm Removal</h2>
              <p>Are you sure you want to remove this item?</p>
              <p className="sale-info">Item: {inventory[selectedRow]?.name} - {inventory[selectedRow]?.category}</p>
              <div className="modal-buttons">
                <button className="btn-confirm btn-danger" onClick={handleConfirmRemove}>Remove</button>
                <button className="btn-cancel" onClick={() => setShowRemoveModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Items;
