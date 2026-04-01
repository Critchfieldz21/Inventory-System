import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './sales.css'; // You can reuse most of items.css logic

const SALES_STORAGE_KEY = 'inventory_sales';
/* Sales data is saved in the localStorage under this key so when you navigate between pages, the data persists */
function Sales() {
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState(() => {
    const savedSales = localStorage.getItem(SALES_STORAGE_KEY);

    if (!savedSales) {
      return [];
    }

    try {
      return JSON.parse(savedSales);
    } catch (error) {
      return [];
    }
  });
  
  const [selectedRow, setSelectedRow] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [formData, setFormData] = useState({
    item: '',
    total: '',
    status: 'Pending'
  });

  useEffect(() => {
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(salesData));
  }, [salesData]);

  const handleAddClick = () => {
    setFormData({ item: '', total: '', status: 'Pending' });
    setShowAddModal(true);
  };

  const handleRemoveClick = () => {
    if (selectedRow !== null) {
      setShowRemoveModal(true);
    } else {
      alert('Please select a sale to remove');
    }
  };

  const handleConfirmAdd = () => {
    if (formData.item && formData.total) {
      const newSale = {
        id: `TX${Math.floor(Math.random() * 10000)}`,
        item: formData.item,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').join('-'),
        total: formData.total.startsWith('$') ? formData.total : `$${formData.total}`,
        status: formData.status
      };
      setSalesData([...salesData, newSale]);
      setShowAddModal(false);
    }
  };

  const handleConfirmRemove = () => {
    setSalesData(salesData.filter((_, index) => index !== selectedRow));
    setShowRemoveModal(false);
    setSelectedRow(null);
  };

  const handleStatusChange = (index, newStatus) => {
    const updatedSales = [...salesData];
    updatedSales[index].status = newStatus;
    setSalesData(updatedSales);
  };

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
          <div className="table-controls">
            <button className="action-btn add-btn" onClick={handleAddClick}>Add</button>
            <button className="action-btn remove-btn" onClick={handleRemoveClick}>Remove</button>
          </div>
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Item</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map((sale, index) => (
                <tr 
                  key={sale.id}
                  onClick={() => setSelectedRow(index)}
                  className={selectedRow === index ? 'selected-row' : ''}
                >
                  <td>{sale.id}</td>
                  <td>{sale.item}</td>
                  <td>{sale.date}</td>
                  <td>{sale.total}</td>
                  <td>
                    <select 
                      className={`status-select ${sale.status.toLowerCase()}`}
                      value={sale.status}
                      onChange={(e) => handleStatusChange(index, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Sale Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Add New Sale</h2>
              <div className="form-group">
                <label>Item Name</label>
                <input 
                  type="text" 
                  value={formData.item}
                  onChange={(e) => setFormData({...formData, item: e.target.value})}
                  placeholder="Enter item name"
                />
              </div>
              <div className="form-group">
                <label>Total Price</label>
                <input 
                  type="text" 
                  value={formData.total}
                  onChange={(e) => setFormData({...formData, total: e.target.value})}
                  placeholder="Enter total price"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="modal-buttons">
                <button className="btn-confirm" onClick={handleConfirmAdd}>Add Sale</button>
                <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Sale Modal */}
        {showRemoveModal && (
          <div className="modal-overlay" onClick={() => setShowRemoveModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Confirm Removal</h2>
              <p>Are you sure you want to remove this sale?</p>
              <p className="sale-info">Order ID: {salesData[selectedRow]?.id} - {salesData[selectedRow]?.item}</p>
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

export default Sales;
