import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { transactionsAPI, itemsAPI, recipesAPI } from '../../api';
import './sales.css';

function SearchableSelect({ options, value, onChange, placeholder, displayKey, valueKey, subKey }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = options.find(o => String(o[valueKey]) === String(value));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o =>
    o[displayKey].toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange(option[valueKey]);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="searchable-select" ref={ref}>
      <div className="searchable-select-input" onClick={() => setOpen(true)}>
        {!open && selected ? (
          <span className="searchable-select-value">
            {selected[displayKey]}{subKey ? ` (Stock: ${selected[subKey]})` : ''}
          </span>
        ) : (
          <input
            autoFocus={open}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            placeholder={selected ? selected[displayKey] : placeholder}
            className="searchable-select-text"
          />
        )}
        <span className="searchable-select-arrow">▾</span>
      </div>
      {open && (
        <ul className="searchable-select-dropdown">
          {filtered.length === 0 ? (
            <li className="searchable-select-no-results">No results found</li>
          ) : (
            filtered.map(option => (
              <li
                key={option[valueKey]}
                className={`searchable-select-option ${String(option[valueKey]) === String(value) ? 'selected' : ''}`}
                onMouseDown={() => handleSelect(option)}
              >
                {option[displayKey]}{subKey ? ` (Stock: ${option[subKey]})` : ''}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

function Sales() {
  const navigate = useNavigate();
  const importInputRef = useRef(null);
  const [salesData, setSalesData] = useState([]);
  const [items, setItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState(null);
  const [saleType, setSaleType] = useState('item'); // 'item' or 'recipe'
  const [selectedRecipeIngredients, setSelectedRecipeIngredients] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); // search by item name or order ID
  const [formData, setFormData] = useState({
    item: '',
    quantity: '',
    total: '',
    status: 'Completed'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesDataBackend, itemsData, recipesData] = await Promise.all([
        transactionsAPI.getSales(),
        itemsAPI.getAll(),
        recipesAPI.getAll()
      ]);
      
      // Handle both paginated (object with results) and direct array responses
      const salesArray = Array.isArray(salesDataBackend) ? salesDataBackend : (salesDataBackend.results || []);
      const itemsArray = Array.isArray(itemsData) ? itemsData : (itemsData.results || []);
      const recipesArray = Array.isArray(recipesData) ? recipesData : (recipesData.results || []);
      
      setSalesData(salesArray);
      setItems(itemsArray);
      setRecipes(recipesArray);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch sales, items, and recipes from backend
  useEffect(() => {
    loadData();
  }, []);

  const handleImportXlsx = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await transactionsAPI.importXlsx(file);
      await loadData();
      alert(`Import complete. Created: ${result.created || 0}, Skipped: ${result.skipped || 0}`);
    } catch (err) {
      console.error('Error importing sales xlsx:', err);
      alert('Failed to import sales xlsx file');
    } finally {
      event.target.value = '';
    }
  };

  const handleAddClick = () => {
    setFormData({ item: '', quantity: '', total: '', status: 'Completed' });
    setSaleType('item');
    setSelectedRecipeIngredients([]);
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
      status: sale.status,
      date: sale.date ? new Date(sale.date).toISOString().slice(0, 16) : ''
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

  const parseRecipeIngredients = (ingredientString) => {
    if (!ingredientString) return [];
    
    // Try parsing as JSON first (format with item IDs)
    if (typeof ingredientString === 'string' && ingredientString.startsWith('[')) {
      try {
        const parsed = JSON.parse(ingredientString);
        if (Array.isArray(parsed)) {
          // JSON format: [{"item": 2, "quantity": 1}, ...]
          // Need to look up item names by ID
          return parsed.map(ing => {
            const itemId = ing.item || ing.id;
            const itemObj = items.find(item => item.id === itemId);
            return {
              name: itemObj ? itemObj.name : `Item ${itemId}`,
              quantity: parseInt(ing.quantity) || 1,
              item_id: itemId
            };
          });
        }
      } catch (e) {
        // JSON parse failed, continue to try text format
        console.log('JSON parse failed, trying text format:', e);
      }
    }
    
    // Fall back to text format parsing (e.g., "2 flour, 1 sugar")
    if (typeof ingredientString === 'string') {
      const parsed = ingredientString.split(',').map(ing => {
        const trimmed = ing.trim();
        // Try to match pattern: number(s) + optional 'x' + ingredient name
        const match = trimmed.match(/^(\d+)\s*x?\s*(.+)$/i);
        if (match) {
          return {
            quantity: parseInt(match[1]) || 1,
            name: match[2].trim()
          };
        }
        // Fallback if no number found
        return {
          quantity: 1,
          name: trimmed
        };
      }).filter(ing => ing.name.length > 0);
      
      return parsed;
    }
    
    return [];
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
        status: formData.status,
        date: formData.date ? new Date(formData.date).toISOString() : undefined
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
    // Validation based on sale type
    if (saleType === 'item') {
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
    } else {
      // Recipe-based sale
      if (!formData.item || !formData.quantity) {
        alert('Please select a recipe and enter a quantity');
        return;
      }

      const recipeQuantity = parseInt(formData.quantity);
      if (recipeQuantity <= 0) {
        alert('Quantity must be greater than 0');
        return;
      }

      try {
        // Check if all ingredients have sufficient stock
        const ingredientsList = parseRecipeIngredients(selectedRecipeIngredients);
        for (const ingredient of ingredientsList) {
          const ingredientItem = items.find(item => 
            item.name.toLowerCase() === ingredient.name.toLowerCase()
          );
          if (!ingredientItem) {
            alert(`Ingredient "${ingredient.name}" not found in inventory`);
            return;
          }
          const requiredQuantity = ingredient.quantity * recipeQuantity;
          if (requiredQuantity > ingredientItem.stock) {
            alert(`Insufficient stock for "${ingredient.name}"! Available: ${ingredientItem.stock}, Required: ${requiredQuantity}`);
            return;
          }
        }

        // Get the selected recipe name
        const selectedRecipe = recipes.find(r => r.id === parseInt(formData.item));
        if (!selectedRecipe) {
          alert('Selected recipe not found');
          return;
        }

        // Calculate total based on ingredients and quantity
        const finalTotal = calculateRecipeTotal(recipeQuantity);

        // Create sales entry for the recipe (using a placeholder or the first ingredient's item ID)
        const recipeItem = items.find(item => item.name.toLowerCase() === selectedRecipe.name.toLowerCase());
        const itemIdToUse = recipeItem ? recipeItem.id : items[0]?.id;

        if (!itemIdToUse) {
          alert('Unable to create recipe sale: no items available');
          return;
        }

        const newSale = await transactionsAPI.create({
          item: itemIdToUse,
          name: selectedRecipe.name, // Store recipe name
          quantity: recipeQuantity,
          total: parseFloat(finalTotal),
          status: formData.status
        });

        // Deduct all ingredients from inventory (multiplied by recipe quantity)
        for (const ingredient of ingredientsList) {
          const ingredientItem = items.find(item => 
            item.name.toLowerCase() === ingredient.name.toLowerCase()
          );
          if (ingredientItem) {
            await itemsAPI.update(ingredientItem.id, {
              ...ingredientItem,
              stock: ingredientItem.stock - (ingredient.quantity * recipeQuantity)
            });
          }
        }

        setSalesData([...salesData, newSale]);
        setShowAddModal(false);
        setFormData({ item: '', quantity: '', total: '', status: 'Completed' });
        setSelectedRecipeIngredients([]);
        setSaleType('item');
        
        // Refresh items to get updated stock
        const updatedItems = await itemsAPI.getAll();
        const itemsArray = Array.isArray(updatedItems) ? updatedItems : (updatedItems.results || []);
        setItems(itemsArray);
      } catch (err) {
        console.error('Error adding recipe sale:', err);
        alert('Failed to add recipe sale: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const calculateRecipeTotal = (quantity = 1) => {
    const ingredientsList = parseRecipeIngredients(selectedRecipeIngredients);
    let total = 0;
    for (const ingredient of ingredientsList) {
      const ingredientItem = items.find(item => 
        item.name.toLowerCase() === ingredient.name.toLowerCase()
      );
      if (ingredientItem) {
        total += ingredientItem.price * ingredient.quantity;
      }
    }
    return (total * quantity).toFixed(2);
  };

  const handleRecipeChange = (recipeId) => {
    const selectedRecipe = recipes.find(r => r.id === parseInt(recipeId));
    if (selectedRecipe) {
      // Use ingredients field (which is JSON format for recipes)
      const ingredientsData = selectedRecipe.ingredients || '';
      setSelectedRecipeIngredients(ingredientsData);
      
      // Calculate total from recipe ingredients (default quantity 1)
      const ingredientsList = parseRecipeIngredients(ingredientsData);
      
      let total = 0;
      for (const ingredient of ingredientsList) {
        const ingredientItem = items.find(item => 
          item.name.toLowerCase() === ingredient.name.toLowerCase()
        );
        if (ingredientItem) {
          total += ingredientItem.price * ingredient.quantity;
        }
      }
      setFormData({
        item: recipeId,
        quantity: 1,
        total: total.toFixed(2),
        status: 'Completed'
      });
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
      const errorMsg = err.message || 'Failed to remove sales';
      alert(errorMsg);
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
    if (saleType === 'item') {
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
    } else {
      // For recipes, recalculate total when quantity changes
      if (name === 'quantity') {
        const quantity = parseInt(value) || 1;
        updatedFormData.total = calculateRecipeTotal(quantity);
      }
    }
    
    setFormData(updatedFormData);
  };

  // Filter sales by item name OR order ID based on the search query
  const filteredSales = salesData.filter(sale => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const itemName = (sale.item_name || '').toLowerCase();
    const orderId  = String(sale.id);
    return itemName.includes(q) || orderId.includes(q);
  });

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
                <button className="action-btn edit-btn" onClick={() => importInputRef.current?.click()}>Import XLSX</button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".xlsx"
                  style={{ display: 'none' }}
                  onChange={handleImportXlsx}
                />
                <button className="action-btn edit-btn" onClick={handleEditClick}>Edit</button>
                <button className="action-btn remove-btn" onClick={handleRemoveClick}>Remove</button>

                {/* Search bar — filters by item name or order ID */}
                <div className="sales-search-wrapper">
                  <input
                    type="text"
                    className="sales-search-input"
                    placeholder="Search by item or order ID…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button className="sales-search-clear" onClick={() => setSearchQuery('')}>✕</button>
                  )}
                </div>
              </div>
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>
                      <input 
                        type="checkbox" 
                        checked={selectedRows.size === filteredSales.length && filteredSales.length > 0}
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
                  {filteredSales.map((sale, index) => (
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
                          <option value="Completed">Completed</option>
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
                <label>Sale Type</label>
                <div className="sale-type-toggle">
                  <button 
                    className={`toggle-btn ${saleType === 'item' ? 'active' : ''}`}
                    onClick={() => {
                      setSaleType('item');
                      setFormData({ item: '', quantity: '', total: '', status: 'Completed' });
                      setSelectedRecipeIngredients([]);
                    }}
                  >
                    Item
                  </button>
                  <button 
                    className={`toggle-btn ${saleType === 'recipe' ? 'active' : ''}`}
                    onClick={() => {
                      setSaleType('recipe');
                      setFormData({ item: '', quantity: '', total: '', status: 'Completed' });
                      setSelectedRecipeIngredients([]);
                    }}
                  >
                    Recipe
                  </button>
                </div>
              </div>

              {saleType === 'item' ? (
                <>
                  <div className="form-group">
                    <label>Item</label>
                    <SearchableSelect
                      options={items}
                      value={formData.item}
                      onChange={(val) => handleFormChange({ target: { name: 'item', value: val } })}
                      placeholder="Search for an item..."
                      displayKey="name"
                      valueKey="id"
                      subKey="stock"
                    />
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
                    <SearchableSelect
                      options={recipes}
                      value={formData.item}
                      onChange={(val) => handleRecipeChange(val)}
                      placeholder="Search for a recipe..."
                      displayKey="name"
                      valueKey="id"
                    />
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
                            // Case-insensitive ingredient matching
                            const ingredientItem = items.find(item => 
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
                  <option value="Completed">Completed</option>
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
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date & Time</label>
                <input
                  type="datetime-local"
                  name="date"
                  value={formData.date || ''}
                  onChange={handleFormChange}
                />
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
