import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { transactionsAPI, itemsAPI, recipesAPI } from '../../api';
import './sales.css';

function Sales() {
  const navigate = useNavigate();
  const [data, setData] = useState({ salesData: [], items: [], recipes: [] });
  const [ui, setUi] = useState({
    loading: true, error: null, selectedRows: new Set(),
    showAddModal: false, showRemoveModal: false, showEditModal: false, editingSaleId: null, saleType: 'item'
  });
  const [formData, setFormData] = useState({ item: '', quantity: '', total: '', status: 'Completed' });
  const [selectedRecipeIngredients, setSelectedRecipeIngredients] = useState([]);

  // Fetch sales, items, and recipes from backend
  useEffect(() => {
    (async () => {
      try {
        const [salesDataBackend, itemsData, recipesData] = await Promise.all([
          transactionsAPI.getSales(), itemsAPI.getAll(), recipesAPI.getAll()
        ]);
        const salesArray = Array.isArray(salesDataBackend) ? salesDataBackend : (salesDataBackend.results || []);
        const itemsArray = Array.isArray(itemsData) ? itemsData : (itemsData.results || []);
        const recipesArray = Array.isArray(recipesData) ? recipesData : (recipesData.results || []);
        setData({ salesData: salesArray, items: itemsArray, recipes: recipesArray });
      } catch (err) {
        console.error('Error:', err);
        setUi(prev => ({ ...prev, error: 'Failed to load sales data' }));
      } finally {
        setUi(prev => ({ ...prev, loading: false }));
      }
    })();
  }, []);

  const setUiState = (updates) => setUi(prev => ({ ...prev, ...updates }));

  const handleAddClick = () => {
    setFormData({ item: '', quantity: '', total: '', status: 'Completed' });
    setUiState({ showAddModal: true, saleType: 'item' });
    setSelectedRecipeIngredients([]);
  };

  const handleRemoveClick = () => {
    if (ui.selectedRows.size === 0) return alert('Select a sale to remove');
    setUiState({ showRemoveModal: true });
  };

  const handleEditClick = () => {
    if (ui.selectedRows.size === 0) return alert('Select a sale to edit');
    if (ui.selectedRows.size > 1) return alert('Select only one sale to edit');
    const selectedIndex = Array.from(ui.selectedRows)[0];
    const sale = data.salesData[selectedIndex];
    setFormData({ item: sale.item, quantity: sale.quantity, total: sale.total, status: sale.status });
    setUiState({ showEditModal: true, editingSaleId: sale.id });
  };

  const handleCheckboxChange = (index) => {
    const newSelected = new Set(ui.selectedRows);
    newSelected.has(index) ? newSelected.delete(index) : newSelected.add(index);
    setUiState({ selectedRows: newSelected });
  };

  const handleSelectAll = () => {
    setUiState({
      selectedRows: ui.selectedRows.size === data.salesData.length ? new Set() : new Set(data.salesData.map((_, i) => i))
    });
  };

  const parseRecipeIngredients = (ingredientString) => {
    if (!ingredientString) return [];
    if (typeof ingredientString === 'string' && ingredientString.startsWith('[')) {
      try {
        const parsed = JSON.parse(ingredientString);
        return Array.isArray(parsed) ? parsed.map(ing => ({ name: data.items.find(item => item.id === (ing.item || ing.id))?.name || `Item ${ing.item || ing.id}`, quantity: parseInt(ing.quantity) || 1 })) : [];
      } catch (e) {}
    }
    if (typeof ingredientString === 'string') {
      return ingredientString.split(',').map(ing => {
        const match = ing.trim().match(/^(\d+)\s*x?\s*(.+)$/i);
        return { quantity: match ? parseInt(match[1]) || 1 : 1, name: match ? match[2].trim() : ing.trim() };
      }).filter(ing => ing.name.length > 0);
    }
    return [];
  };

  const calculateRecipeTotal = (quantity = 1) => {
    const ingredientsList = parseRecipeIngredients(selectedRecipeIngredients);
    return (ingredientsList.reduce((total, ing) => {
      const item = data.items.find(i => i.name.toLowerCase() === ing.name.toLowerCase());
      return total + (item ? item.price * ing.quantity : 0);
    }, 0) * quantity).toFixed(2);
  };

  const handleRecipeChange = (recipeId) => {
    const selectedRecipe = data.recipes.find(r => r.id === parseInt(recipeId));
    if (!selectedRecipe) return;
    const ingredientsData = selectedRecipe.ingredients || '';
    setSelectedRecipeIngredients(ingredientsData);
    setFormData({ item: recipeId, quantity: 1, total: calculateRecipeTotal(1), status: 'Completed' });
  };

  const handleConfirmRemove = async () => {
    try {
      const ids = Array.from(ui.selectedRows).map(i => data.salesData[i].id);
      await Promise.all(ids.map(id => transactionsAPI.delete(id)));
      setData(prev => ({ ...prev, salesData: prev.salesData.filter((_, i) => !ui.selectedRows.has(i)) }));
      setUiState({ showRemoveModal: false, selectedRows: new Set() });
    } catch (err) {
      alert('Failed to remove sales');
    }
  };

  const handleStatusChange = async (index, newStatus) => {
    try {
      const saleToUpdate = data.salesData[index];
      await transactionsAPI.update(saleToUpdate.id, { ...saleToUpdate, status: newStatus });
      const updatedSales = [...data.salesData];
      updatedSales[index].status = newStatus;
      setData(prev => ({ ...prev, salesData: updatedSales }));
    } catch (err) {
      alert('Failed to update sale status');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };
    
    if (ui.saleType === 'item') {
      if ((name === 'item' || name === 'quantity') && updatedFormData.item && updatedFormData.quantity) {
        const selectedItem = data.items.find(item => item.id === parseInt(updatedFormData.item));
        if (selectedItem) {
          const itemPrice = parseFloat(selectedItem.price);
          const quantity = parseInt(updatedFormData.quantity) || 0;
          updatedFormData.total = (itemPrice * quantity).toFixed(2);
        }
      }
    } else if (name === 'quantity') {
      const quantity = parseInt(value) || 1;
      updatedFormData.total = calculateRecipeTotal(quantity);
    }
    
    setFormData(updatedFormData);
  };

  const handleConfirmAdd = async () => {
    if (!formData.item || !formData.quantity || !formData.total) return alert('Please fill in all fields');
    try {
      const newSale = { item: parseInt(formData.item), quantity: parseInt(formData.quantity), total: parseFloat(formData.total), status: formData.status };
      const createdSale = await transactionsAPI.create(newSale);
      setData(prev => ({ ...prev, salesData: [...prev.salesData, createdSale] }));
      setUiState({ showAddModal: false, saleType: 'item' });
      setFormData({ item: '', quantity: '', total: '', status: 'Completed' });
    } catch (err) {
      alert('Failed to add sale');
    }
  };

  const handleConfirmEdit = async () => {
    if (!formData.item || !formData.quantity || !formData.total) return alert('Please fill in all fields');
    try {
      const updateData = { item: parseInt(formData.item), quantity: parseInt(formData.quantity), total: parseFloat(formData.total), status: formData.status };
      await transactionsAPI.update(ui.editingSaleId, updateData);
      const updatedSales = data.salesData.map(sale => sale.id === ui.editingSaleId ? { ...sale, ...updateData } : sale);
      setData(prev => ({ ...prev, salesData: updatedSales }));
      setUiState({ showEditModal: false, editingSaleId: null });
      setFormData({ item: '', quantity: '', total: '', status: 'Completed' });
    } catch (err) {
      alert('Failed to update sale');
    }
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
          {ui.loading ? (
            <div className="loading-message">Loading sales data...</div>
          ) : ui.error ? (
            <div className="error-message">{ui.error}</div>
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
                        checked={ui.selectedRows.size === data.salesData.length && data.salesData.length > 0}
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
                  {data.salesData.map((sale, index) => (
                    <tr 
                      key={sale.id}
                      className={ui.selectedRows.has(index) ? 'selected-row' : ''}
                    >
                      <td>
                        <input 
                          type="checkbox" 
                          checked={ui.selectedRows.has(index)}
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
        {ui.showAddModal && (
          <div className="modal-overlay" onClick={() => setUiState({ showAddModal: false })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Add New Sale</h2>
              <div className="form-group">
                <label>Sale Type</label>
                <div className="sale-type-toggle">
                  <button 
                    className={`toggle-btn ${ui.saleType === 'item' ? 'active' : ''}`}
                    onClick={() => {
                      setUiState({ saleType: 'item' });
                      setFormData({ item: '', quantity: '', total: '', status: 'Completed' });
                      setSelectedRecipeIngredients([]);
                    }}
                  >
                    Item
                  </button>
                  <button 
                    className={`toggle-btn ${ui.saleType === 'recipe' ? 'active' : ''}`}
                    onClick={() => {
                      setUiState({ saleType: 'recipe' });
                      setFormData({ item: '', quantity: '', total: '', status: 'Completed' });
                      setSelectedRecipeIngredients([]);
                    }}
                  >
                    Recipe
                  </button>
                </div>
              </div>

              {ui.saleType === 'item' ? (
                <>
                  <div className="form-group">
                    <label>Item</label>
                    <select 
                      name="item"
                      value={formData.item}
                      onChange={handleFormChange}
                    >
                      <option value="">Select an item</option>
                      {data.items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} (Stock: {item.stock})
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
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Recipe</label>
                    <select 
                      name="item"
                      value={formData.item}
                      onChange={(e) => handleRecipeChange(e.target.value)}
                    >
                      <option value="">Select a recipe</option>
                      {data.recipes.map((recipe) => (
                        <option key={recipe.id} value={recipe.id}>
                          {recipe.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Recipe Quantity</label>
                    <input 
                      type="number" 
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleFormChange}
                      placeholder="How many recipes to make?"
                      min="1"
                    />
                  </div>
                  {selectedRecipeIngredients !== undefined && selectedRecipeIngredients !== null && (
                    <div className="form-group">
                      <label>Ingredients Required:</label>
                      <div className="ingredients-list">
                        {(() => {
                          const ingredientsList = parseRecipeIngredients(selectedRecipeIngredients);
                          
                          if (ingredientsList.length === 0) {
                            return <div className="no-ingredients">No ingredients added to this recipe</div>;
                          }
                          return ingredientsList.map((ing, index) => {
                            const ingredientItem = data.items.find(item => 
                              item.name.toLowerCase() === ing.name.toLowerCase()
                            );
                            const requiredQty = ing.quantity * (parseInt(formData.quantity) || 1);
                            const hasEnough = ingredientItem && requiredQty <= ingredientItem.stock;
                            return (
                              <div key={index} className={`ingredient-item ${hasEnough ? '' : 'insufficient'}`}>
                                <span>{requiredQty}x {ing.name}</span>
                                <span className={`ingredient-stock ${!hasEnough ? 'warning' : ''}`}>
                                  Available: {ingredientItem?.stock || 0}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="form-group">
                <label>Total Price (Auto-calculated)</label>
                <input 
                  type="number" 
                  name="total"
                  value={formData.total}
                  onChange={handleFormChange}
                  placeholder="Auto-calculated"
                  step="0.01"
                  disabled={true}
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
                <button className="btn-cancel" onClick={() => setUiState({ showAddModal: false })}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Sale Modal */}
        {ui.showRemoveModal && (
          <div className="modal-overlay" onClick={() => setUiState({ showRemoveModal: false })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Confirm Removal</h2>
              <p>Are you sure you want to remove {ui.selectedRows.size} sale(s)?</p>
              <div className="items-to-remove">
                {Array.from(ui.selectedRows).map((index) => (
                  <div key={data.salesData[index]?.id} className="item-to-remove">
                    • Order ID: {data.salesData[index]?.id} - {data.salesData[index]?.item_name || data.salesData[index]?.item}
                  </div>
                ))}
              </div>
              <div className="modal-buttons">
                <button className="btn-confirm btn-danger" onClick={handleConfirmRemove}>Remove {ui.selectedRows.size} Sale(s)</button>
                <button className="btn-cancel" onClick={() => setUiState({ showRemoveModal: false })}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Sale Modal */}
        {ui.showEditModal && (
          <div className="modal-overlay" onClick={() => setUiState({ showEditModal: false })}>
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
                  {data.items.map((item) => (
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
                <button className="btn-cancel" onClick={() => setUiState({ showEditModal: false })}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Sales;
