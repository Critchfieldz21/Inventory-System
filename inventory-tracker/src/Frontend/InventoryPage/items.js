import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { itemsAPI, recipesAPI } from '../../api';
import './items.css';

const EMPTY_FORM = { name: '', category: '', stock: '', cost_price: '', price: '' };

function Items() {
  const navigate = useNavigate();
  const [data, setData] = useState({ recipes: [], inventory: [] });
  const [ui, setUi] = useState({
    loading: true, error: null, selectedItems: new Set(),
    showAddModal: false, showRemoveModal: false, showEditModal: false, editingItemId: null
  });
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Fetch data from backend
  useEffect(() => {
    (async () => {
      try {
        const [itemsData, recipesData] = await Promise.all([itemsAPI.getAll(), recipesAPI.getAll()]);
        const itemsArray = Array.isArray(itemsData) ? itemsData : (itemsData.results || []);
        const recipesArray = Array.isArray(recipesData) ? recipesData : (recipesData.results || []);
        setData({
          recipes: recipesArray,
          inventory: itemsArray.map(item => ({
            id: item.id, name: item.name, category: item.category, stock: item.stock,
            cost_price: `$${parseFloat(item.cost_price || 0).toFixed(2)}`, price: `$${parseFloat(item.price).toFixed(2)}`
          }))
        });
      } catch (err) {
        console.error('Error:', err);
        setUi(prev => ({ ...prev, error: 'Failed to load items' }));
      } finally {
        setUi(prev => ({ ...prev, loading: false }));
      }
    })();
  }, []);

  const setUiState = (updates) => setUi(prev => ({ ...prev, ...updates }));
  const formatPrice = (price) => parseFloat(price.replace('$', '') || 0);
  const getRecipeItems = () => new Set(data.recipes.flatMap(r =>
    data.inventory.filter(i => r.ingredients?.includes(i.name)).map(i => i.name)
  ));

  const handleAddClick = () => {
    setFormData(EMPTY_FORM);
    setUiState({ showAddModal: true });
  };

  const getItemsInRecipes = () => {
    const itemsUsed = new Set();
    data.recipes.forEach(recipe => {
      data.inventory.forEach(item => {
        if (recipe.ingredients?.includes(item.name)) itemsUsed.add(item.name);
      });
    });
    return itemsUsed;
  };

  const handleRemoveClick = () => {
    if (ui.selectedItems.size === 0) return alert('Select at least one item');
    const blocked = [...ui.selectedItems].map(i => data.inventory[i].name).filter(n => getItemsInRecipes().has(n));
    if (blocked.length) return alert(`Cannot remove: ${blocked.join(', ')}\n\nThese are used in recipes.`);
    setUiState({ showRemoveModal: true });
  };

  const handleCheckboxChange = (index) => {
    const newSelected = new Set(ui.selectedItems);
    newSelected.has(index) ? newSelected.delete(index) : newSelected.add(index);
    setUiState({ selectedItems: newSelected });
  };

  const handleSelectAll = () => {
    setUiState({
      selectedItems: ui.selectedItems.size === data.inventory.length ? new Set() : new Set(data.inventory.map((_, i) => i))
    });
  };

  const handleConfirmAdd = async () => {
    const { name, category, stock, cost_price, price } = formData;
    if (!name || !category || !stock || !cost_price || !price) return alert('Fill all fields');
    const costPrice = formatPrice(cost_price);
    const sellingPrice = formatPrice(price);
    if (costPrice >= sellingPrice) return alert('Cost Price must be less than Selling Price!');

    try {
      const existing = data.inventory.find(i => i.name === name);
      if (existing) {
        const updated = await itemsAPI.update(existing.id, {
          name, category, stock: existing.stock + parseInt(stock), cost_price: costPrice, price: sellingPrice
        });
        setData(prev => ({
          ...prev,
          inventory: prev.inventory.map(i => i.id === existing.id ? {
            id: updated.id, name: updated.name, category: updated.category, stock: updated.stock,
            cost_price: `$${parseFloat(updated.cost_price).toFixed(2)}`, price: `$${parseFloat(updated.price).toFixed(2)}`
          } : i)
        }));
      } else {
        const newItem = await itemsAPI.create({ name, category, stock: parseInt(stock), cost_price: costPrice, price: sellingPrice });
        setData(prev => ({
          ...prev,
          inventory: [...prev.inventory, {
            id: newItem.id, name: newItem.name, category: newItem.category, stock: newItem.stock,
            cost_price: `$${parseFloat(newItem.cost_price).toFixed(2)}`, price: `$${parseFloat(newItem.price).toFixed(2)}`
          }]
        }));
      }
      setUiState({ showAddModal: false });
      setFormData(EMPTY_FORM);
    } catch (err) {
      alert('Failed to add item');
    }
  };

  const handleConfirmRemove = async () => {
    try {
      const ids = [...ui.selectedItems].map(i => data.inventory[i].id);
      await Promise.all(ids.map(id => itemsAPI.delete(id)));
      setData(prev => ({ ...prev, inventory: prev.inventory.filter((_, i) => !ui.selectedItems.has(i)) }));
      setUiState({ showRemoveModal: false, selectedItems: new Set() });
    } catch (err) {
      alert('Failed to remove items');
    }
  };

  const handleConfirmEdit = async () => {
    const { name, category, stock, cost_price, price } = formData;
    if (!name || !category || !stock || !cost_price || !price) return alert('Fill all fields');
    const costPrice = formatPrice(cost_price);
    const sellingPrice = formatPrice(price);
    if (costPrice >= sellingPrice) return alert('Cost Price must be less than Selling Price!');

    try {
      const updated = await itemsAPI.update(ui.editingItemId, {
        name, category, stock: parseInt(stock), cost_price: costPrice, price: sellingPrice
      });
      setData(prev => ({
        ...prev,
        inventory: prev.inventory.map(i => i.id === ui.editingItemId ? {
          id: updated.id, name: updated.name, category: updated.category, stock: updated.stock,
          cost_price: `$${parseFloat(updated.cost_price).toFixed(2)}`, price: `$${parseFloat(updated.price).toFixed(2)}`
        } : i)
      }));
      setUiState({ showEditModal: false, editingItemId: null });
      setFormData(EMPTY_FORM);
    } catch (err) {
      alert('Failed to update item');
    }
  };

  return (
    <div className="home-layout">
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
          {ui.error && <p style={{color: 'red'}}>{ui.error}</p>}
          <h1>Inventory Items</h1>
        </header>

        <div className="table-container">
          {ui.loading ? <div style={{textAlign: 'center', padding: '40px', color: '#6b7280'}}>Loading items...</div> : (
            <>
              <div className="table-controls">
                <button className="action-btn add-btn" onClick={handleAddClick}>Add</button>
                <button className="action-btn edit-btn" onClick={() => {
                  if (ui.selectedItems.size !== 1) return alert(ui.selectedItems.size === 0 ? 'Select one item' : 'Select only one item');
                  const item = data.inventory[[...ui.selectedItems][0]];
                  setFormData({ name: item.name, category: item.category, stock: item.stock, cost_price: item.cost_price.replace('$', ''), price: item.price.replace('$', '') });
                  setUiState({ showEditModal: true, editingItemId: item.id });
                }}>Edit</button>
                <button className="action-btn remove-btn" onClick={handleRemoveClick}>Remove</button>
              </div>

              <table className="inventory-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" checked={ui.selectedItems.size === data.inventory.length && data.inventory.length > 0} onChange={handleSelectAll} /></th>
                    <th>Item Name</th><th>Category</th><th>Stock</th><th>Cost Price</th><th>Selling Price</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.inventory.map((item, index) => (
                    <tr key={item.id} className={ui.selectedItems.has(index) ? 'selected-row' : ''}>
                      <td><input type="checkbox" checked={ui.selectedItems.has(index)} onChange={() => handleCheckboxChange(index)} /></td>
                      <td>{item.name}</td><td>{item.category}</td><td>{item.stock}</td><td>{item.cost_price}</td><td>{item.price}</td>
                      <td><span className={`stock-tag ${item.stock < 10 ? 'critical' : item.stock < 20 ? 'warning' : 'healthy'}`}>{item.stock < 10 ? 'Low Stock' : 'In Stock'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Add Item Modal */}
        {ui.showAddModal && (
          <div className="modal-overlay" onClick={() => setUiState({ showAddModal: false })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Add New Item</h2>
              {['Item Name', 'Category', 'Stock', 'Cost Price', 'Selling Price'].map((label, i) => {
                const keys = ['name', 'category', 'stock', 'cost_price', 'price'];
                return (
                  <div key={i} className="form-group">
                    <label>{label}</label>
                    <input type={label === 'Stock' ? 'number' : 'text'} value={formData[keys[i]]} onChange={(e) => setFormData({...formData, [keys[i]]: e.target.value})} placeholder={label} />
                  </div>
                );
              })}
              <div className="modal-buttons">
                <button className="btn-confirm" onClick={handleConfirmAdd}>Add</button>
                <button className="btn-cancel" onClick={() => setUiState({ showAddModal: false })}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Item Modal */}
        {ui.showRemoveModal && (
          <div className="modal-overlay" onClick={() => setUiState({ showRemoveModal: false })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Confirm Removal</h2>
              <p>Remove {ui.selectedItems.size} item(s)?</p>
              <div className="modal-buttons">
                <button className="btn-confirm btn-danger" onClick={handleConfirmRemove}>Remove</button>
                <button className="btn-cancel" onClick={() => setUiState({ showRemoveModal: false })}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Item Modal */}
        {ui.showEditModal && (
          <div className="modal-overlay" onClick={() => setUiState({ showEditModal: false })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Edit Item</h2>
              {['Item Name', 'Category', 'Stock', 'Cost Price', 'Selling Price'].map((label, i) => {
                const keys = ['name', 'category', 'stock', 'cost_price', 'price'];
                return (
                  <div key={i} className="form-group">
                    <label>{label}</label>
                    <input type={label === 'Stock' ? 'number' : 'text'} value={formData[keys[i]]} onChange={(e) => setFormData({...formData, [keys[i]]: e.target.value})} />
                  </div>
                );
              })}
              <div className="modal-buttons">
                <button className="btn-confirm" onClick={handleConfirmEdit}>Update</button>
                <button className="btn-cancel" onClick={() => setUiState({ showEditModal: false })}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Items;
