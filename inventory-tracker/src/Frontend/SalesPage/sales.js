import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { transactionsAPI, itemsAPI } from '../../api';
import './sales.css';

function Sales() {
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState(null);
  const [formData, setFormData] = useState({
    item: '',
    quantity: '',
    total: '',
    status: 'Completed'
  });

  // Fetch sales and items from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [salesDataBackend, itemsData] = await Promise.all([
          transactionsAPI.getSales(),
          itemsAPI.getAll()
        ]);
        
        // Handle both paginated (object with results) and direct array responses
        const salesArray = Array.isArray(salesDataBackend) ? salesDataBackend : (salesDataBackend.results || []);
        const itemsArray = Array.isArray(itemsData) ? itemsData : (itemsData.results || []);
        
        setSalesData(salesArray);
        setItems(itemsArray);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load sales data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddClick = () => {
    setFormData({ item: '', quantity: '', total: '', status: 'Completed' });
    setShowAddModal(true);
  };

  const handleRemoveClick = () => {
    if (selectedRows.size > 0) {
      setShowRemoveModal(true);
    } else {
      alert('Please select a sale to remove');
    }
  };

  const handleEditClick = () => {
    if (selectedRows.size === 0) {
      alert('Please select a sale to edit');
      return;
    }
    
    if (selectedRows.size > 1) {
      alert('Please select only one sale to edit');
      return;
    }
    
    const selectedIndex = Array.from(selectedRows)[0];
    const sale = salesData[selectedIndex];
    setEditingSaleId(sale.id);
    setFormData({
      item: sale.item,
      quantity: sale.quantity,
      total: sale.total,
      status: sale.status
    });
    setShowEditModal(true);
  };

  const handleCheckboxChange = (index) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === salesData.length) {
      setSelectedRows(new Set());
    } else {
      const allIndices = new Set(salesData.map((_, index) => index));
      setSelectedRows(allIndices);
    }
  };

  const handleConfirmEdit = async () => {
    if (!formData.item || !formData.quantity) {
      alert('Please select an item and enter a quantity');
      return;
    }

    try {
      const updatedSale = await transactionsAPI.update(editingSaleId, {
        item: parseInt(formData.item),
        quantity: parseInt(formData.quantity),
        total: parseFloat(formData.total),
        status: formData.status
      });

      const updatedSales = salesData.map(sale =>
        sale.id === editingSaleId ? updatedSale : sale
      );
      
      setSalesData(updatedSales);
      setShowEditModal(false);
      setEditingSaleId(null);
      setFormData({ item: '', quantity: '', total: '', status: 'Completed' });
    } catch (err) {
      console.error('Error updating sale:', err);
      alert('Failed to update sale');
    }
  };

  const handleConfirmAdd = async () => {
    // Validation: need item and quantity at minimum
    if (!formData.item || !formData.quantity) {
      alert('Please select an item and enter a quantity');
      return;
    }
    
    // Check if quantity exceeds available stock
    const selectedItem = items.find(item => item.id === parseInt(formData.item));
    if (!selectedItem) {
      alert('Selected item not found');
      return;
    }
    
    const quantityToSell = parseInt(formData.quantity);
    if (quantityToSell > selectedItem.stock) {
      alert(`Insufficient stock! Available: ${selectedItem.stock}, Requested: ${quantityToSell}`);
      return;
    }
    
    // If total isn't set, calculate it
    let finalTotal = formData.total;
    if (!finalTotal) {
      finalTotal = (parseFloat(selectedItem.price) * quantityToSell).toFixed(2);
    }

    try {
      const newSale = await transactionsAPI.create({
        item: parseInt(formData.item),
        quantity: quantityToSell,
        total: parseFloat(finalTotal),
        status: formData.status
      });
      setSalesData([...salesData, newSale]);
      setShowAddModal(false);
      setFormData({ item: '', quantity: '', total: '', status: 'Completed' });
      
      // Refresh items to get updated stock
      const updatedItems = await itemsAPI.getAll();
      const itemsArray = Array.isArray(updatedItems) ? updatedItems : (updatedItems.results || []);
      setItems(itemsArray);
    } catch (err) {
      console.error('Error adding sale:', err);
      alert('Failed to add sale: ' + (err.message || 'Unknown error'));
    }
  };

  const handleConfirmRemove = async () => {
    try {
      const salesToDelete = [];
      selectedRows.forEach(index => {
        salesToDelete.push(salesData[index].id);
      });
      
      await Promise.all(salesToDelete.map(id => transactionsAPI.delete(id)));
      
      setSalesData(salesData.filter((_, index) => !selectedRows.has(index)));
      setShowRemoveModal(false);
      setSelectedRows(new Set());
    } catch (err) {
      console.error('Error removing sales:', err);
      alert('Failed to remove sales');
    }
  };

  const handleStatusChange = async (index, newStatus) => {
    try {
      const saleToUpdate = salesData[index];
      await transactionsAPI.update(saleToUpdate.id, {
        ...saleToUpdate,
        status: newStatus
      });
      const updatedSales = [...salesData];
      updatedSales[index].status = newStatus;
      setSalesData(updatedSales);
    } catch (err) {
      console.error('Error updating sale status:', err);
      alert('Failed to update sale status');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: value
    };
    
    // Auto-calculate total when item or quantity changes
    if (name === 'item' || name === 'quantity') {
      if (updatedFormData.item && updatedFormData.quantity) {
        const selectedItem = items.find(item => item.id === parseInt(updatedFormData.item));
        if (selectedItem) {
          const itemPrice = parseFloat(selectedItem.price);
          const quantity = parseInt(updatedFormData.quantity) || 0;
          const calculatedTotal = (itemPrice * quantity).toFixed(2);
          updatedFormData.total = calculatedTotal;
        }
      }
    }
    
    setFormData(updatedFormData);
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
          {loading ? (
            <div className="loading-message">Loading sales data...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <>
              <div className="table-controls">
                <button className="action-btn add-btn" onClick={handleAddClick}>Add</button>
                <button className="action-btn edit-btn" onClick={handleEditClick}>Edit</button>
                <button className="action-btn remove-btn" onClick={handleRemoveClick}>Remove</button>
              </div>
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>
                      <input 
                        type="checkbox" 
                        checked={selectedRows.size === salesData.length && salesData.length > 0}
                        onChange={handleSelectAll}
                        className="checkbox-header"
                      />
                    </th>
                    <th>Order ID</th>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.map((sale, index) => (
                    <tr 
                      key={sale.id}
                      className={selectedRows.has(index) ? 'selected-row' : ''}
                    >
                      <td>
                        <input 
                          type="checkbox" 
                          checked={selectedRows.has(index)}
                          onChange={() => handleCheckboxChange(index)}
                          className="checkbox-item"
                        />
                      </td>
                      <td>{sale.id}</td>
                      <td>{sale.item_name || sale.item}</td>
                      <td>{sale.quantity}</td>
                      <td>{new Date(sale.date).toLocaleDateString()}</td>
                      <td>${parseFloat(sale.total).toFixed(2)}</td>
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
            </>
          )}
        </div>

        {/* Add Sale Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Add New Sale</h2>
              <div className="form-group">
                <label>Item</label>
                <select 
                  name="item"
                  value={formData.item}
                  onChange={handleFormChange}
                >
                  <option value="">Select an item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input 
                  type="number" 
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleFormChange}
                  placeholder="Enter quantity"
                />
              </div>
              <div className="form-group">
                <label>Total Price (Auto-calculated)</label>
                <input 
                  type="number" 
                  name="total"
                  value={formData.total}
                  onChange={handleFormChange}
                  placeholder="Auto-calculated"
                  step="0.01"
                  disabled={formData.item && formData.quantity}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select 
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
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
              <p>Are you sure you want to remove {selectedRows.size} sale(s)?</p>
              <div className="items-to-remove">
                {Array.from(selectedRows).map((index) => (
                  <div key={salesData[index]?.id} className="item-to-remove">
                    • Order ID: {salesData[index]?.id} - {salesData[index]?.item_name || salesData[index]?.item}
                  </div>
                ))}
              </div>
              <div className="modal-buttons">
                <button className="btn-confirm btn-danger" onClick={handleConfirmRemove}>Remove {selectedRows.size} Sale(s)</button>
                <button className="btn-cancel" onClick={() => setShowRemoveModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Sale Modal */}
        {showEditModal && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Edit Sale</h2>
              <div className="form-group">
                <label>Item</label>
                <select 
                  name="item"
                  value={formData.item}
                  onChange={handleFormChange}
                >
                  <option value="">Select an item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input 
                  type="number" 
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleFormChange}
                  placeholder="Enter quantity"
                />
              </div>
              <div className="form-group">
                <label>Total Price</label>
                <input 
                  type="number" 
                  name="total"
                  value={formData.total}
                  onChange={handleFormChange}
                  placeholder="Total price"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select 
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="modal-buttons">
                <button className="btn-confirm" onClick={handleConfirmEdit}>Update Sale</button>
                <button className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Sales;
