import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { transactionsAPI, itemsAPI, recipesAPI } from '../../api';
import AddSaleModal from './AddSaleModal';
import EditSaleModal from './EditSaleModal';
import RemoveSaleModal from './RemoveSaleModal';
import './sales.css';
import './SalesTable.css';
import './SalesModal.css';
import './SalesSearchableSelect.css';

function Sales() {
  const navigate = useNavigate();
  const importInputRef = useRef(null);
  const [salesData, setSalesData] = useState([]);
  const [items, setItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [salesDataBackend, itemsData, recipesData] = await Promise.all([
        transactionsAPI.getSales(),
        itemsAPI.getAll(),
        recipesAPI.getAll()
      ]);

      const salesArray   = Array.isArray(salesDataBackend) ? salesDataBackend : (salesDataBackend.results || []);
      const itemsArray   = Array.isArray(itemsData)        ? itemsData        : (itemsData.results        || []);
      const recipesArray = Array.isArray(recipesData)      ? recipesData      : (recipesData.results      || []);

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
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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

  const handleCheckboxChange = useCallback((index) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedRows(prev =>
      prev.size === salesData.length
        ? new Set()
        : new Set(salesData.map((_, i) => i))
    );
  }, [salesData]);

  const parseRecipeIngredients = useCallback((ingredientString) => {
    if (!ingredientString) return [];

    // Try parsing as JSON first (format with item IDs)
    if (typeof ingredientString === 'string' && ingredientString.startsWith('[')) {
      try {
        const parsed = JSON.parse(ingredientString);
        if (Array.isArray(parsed)) {
          return parsed.map(ing => {
            const itemId  = ing.item || ing.id;
            const itemObj = items.find(item => item.id === itemId);
            return { name: itemObj ? itemObj.name : `Item ${itemId}`, quantity: parseInt(ing.quantity) || 1, item_id: itemId };
          });
        }
      } catch (e) {
        console.log('JSON parse failed, trying text format:', e);
      }
    }

    // Fall back to text format (e.g., "2 flour, 1 sugar")
    if (typeof ingredientString === 'string') {
      return ingredientString.split(',').map(ing => {
        const trimmed = ing.trim();
        const match   = trimmed.match(/^(\d+)\s*x?\s*(.+)$/i);
        return match
          ? { quantity: parseInt(match[1]) || 1, name: match[2].trim() }
          : { quantity: 1, name: trimmed };
      }).filter(ing => ing.name.length > 0);
    }

    return [];
  }, [items]);

  const calculateRecipeTotal = useCallback((quantity = 1) => {
    const ingredientsList = parseRecipeIngredients(selectedRecipeIngredients);
    let total = 0;
    for (const ingredient of ingredientsList) {
      const ingredientItem = items.find(item =>
        item.name.toLowerCase() === ingredient.name.toLowerCase()
      );
      if (ingredientItem) total += ingredientItem.price * ingredient.quantity;
    }
    return (total * quantity).toFixed(2);
  }, [items, parseRecipeIngredients, selectedRecipeIngredients]);

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

  // Filter sales by item name or order ID — memoized to avoid refiltering on every render
  const filteredSales = useMemo(() => {
    if (!searchQuery.trim()) return salesData;
    const q = searchQuery.toLowerCase();
    return salesData.filter(sale => {
      const itemName = (sale.item_name || '').toLowerCase();
      const orderId  = String(sale.id);
      return itemName.includes(q) || orderId.includes(q);
    });
  }, [salesData, searchQuery]);

  return (
    <div className={`home-layout${sidebarOpen ? ' sidebar-open' : ''}`}>

      {/* ── Hamburger Button ── */}
      <button
        className={`hamburger-btn${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(o => !o)}
        aria-label="Toggle sidebar"
      >
        <span /><span /><span />
      </button>

      {/* ── Overlay ── */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <h2 className="sidebar-logo">Inventory Tracker</h2>
        <nav className="nav-links">
          <Link to="/home" onClick={() => setSidebarOpen(false)}>Home</Link>
          <Link to="/inventory" onClick={() => setSidebarOpen(false)}>Inventory</Link>
          <Link to="/sales" className="active" onClick={() => setSidebarOpen(false)}>Sales</Link>
          <Link to="/recipe" onClick={() => setSidebarOpen(false)}>Recipes</Link>
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
          <AddSaleModal
            items={items}
            recipes={recipes}
            formData={formData}
            setFormData={setFormData}
            saleType={saleType}
            setSaleType={setSaleType}
            selectedRecipeIngredients={selectedRecipeIngredients}
            setSelectedRecipeIngredients={setSelectedRecipeIngredients}
            handleConfirmAdd={handleConfirmAdd}
            handleFormChange={handleFormChange}
            handleRecipeChange={handleRecipeChange}
            parseRecipeIngredients={parseRecipeIngredients}
            onClose={() => setShowAddModal(false)}
          />
        )}

        {/* Remove Sale Modal */}
        {showRemoveModal && (
          <RemoveSaleModal
            selectedRows={selectedRows}
            salesData={salesData}
            handleConfirmRemove={handleConfirmRemove}
            onClose={() => setShowRemoveModal(false)}
          />
        )}

        {/* Edit Sale Modal */}
        {showEditModal && (
          <EditSaleModal
            items={items}
            formData={formData}
            handleFormChange={handleFormChange}
            handleConfirmEdit={handleConfirmEdit}
            onClose={() => setShowEditModal(false)}
          />
        )}
      </main>
    </div>
  );
}

export default Sales;
