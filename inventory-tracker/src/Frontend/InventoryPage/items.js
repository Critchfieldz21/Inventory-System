import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { itemsAPI, recipesAPI } from '../../api';
import './items.css';

function Items() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isCreatingNewItem, setIsCreatingNewItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    stock: '',
    cost_price: '',
    price: ''
  });

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [itemsData, recipesData] = await Promise.all([
          itemsAPI.getAll(),
          recipesAPI.getAll()
        ]);
        
        // Handle both paginated (object with results) and direct array responses
        const itemsArray = Array.isArray(itemsData) ? itemsData : (itemsData.results || []);
        const recipesArray = Array.isArray(recipesData) ? recipesData : (recipesData.results || []);
        
        // Convert backend data to frontend format
        const formattedItems = itemsArray.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          stock: item.stock,
          cost_price: `$${parseFloat(item.cost_price || 0).toFixed(2)}`,
          price: `$${parseFloat(item.price).toFixed(2)}`
        }));
        
        setInventory(formattedItems);
        setRecipes(recipesArray);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load items and recipes');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddClick = () => {
    setFormData({ name: '', category: '', stock: '', cost_price: '', price: '' });
    setIsCreatingNewItem(false);
    setShowAddModal(true);
  };

  const getItemsInRecipes = () => {
    const itemsUsed = new Set();
    recipes.forEach(recipe => {
      inventory.forEach(item => {
        if (recipe.ingredients.includes(item.name)) {
          itemsUsed.add(item.name);
        }
      });
    });
    return itemsUsed;
  };

  const handleRemoveClick = () => {
    if (selectedItems.size === 0) {
      alert('Please select at least one item to remove');
      return;
    }

    const itemsUsed = getItemsInRecipes();
    const blockedItems = [];
    const selectedItemNames = [];

    selectedItems.forEach(index => {
      selectedItemNames.push(inventory[index].name);
    });

    selectedItemNames.forEach(itemName => {
      if (itemsUsed.has(itemName)) {
        blockedItems.push(itemName);
      }
    });

    if (blockedItems.length > 0) {
      const blockedList = blockedItems.join(', ');
      alert(`Cannot remove these items because they are used in recipes:\n\n${blockedList}\n\nPlease remove the recipes first.`);
      return;
    }

    setShowRemoveModal(true);
  };

  const handleCheckboxChange = (index) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === inventory.length) {
      setSelectedItems(new Set());
    } else {
      const allIndices = new Set(inventory.map((_, index) => index));
      setSelectedItems(allIndices);
    }
  };

  const handleConfirmAdd = async () => {
    if (formData.name && formData.category && formData.stock && formData.cost_price && formData.price) {
      // Validate that cost price is less than selling price
      const costPrice = parseFloat(formData.cost_price.replace('$', ''));
      const sellingPrice = parseFloat(formData.price.replace('$', ''));
      
      if (costPrice >= sellingPrice) {
        alert('Cost Price must be less than Selling Price!');
        return;
      }
      
      try {
        // Check if item already exists
        const existingItem = inventory.find(item => item.name === formData.name);
        
        if (existingItem && !isCreatingNewItem) {
          // Update existing item's stock
          const updatedItem = await itemsAPI.update(existingItem.id, {
            name: existingItem.name,
            category: existingItem.category,
            stock: existingItem.stock + parseInt(formData.stock),
            cost_price: parseFloat(existingItem.cost_price.replace('$', '')),
            price: existingItem.price.replace('$', '')
          });
          
          // Update inventory in state
          const updatedInventory = inventory.map(item => 
            item.id === existingItem.id 
              ? {
                  id: updatedItem.id,
                  name: updatedItem.name,
                  category: updatedItem.category,
                  stock: updatedItem.stock,
                  cost_price: `$${parseFloat(updatedItem.cost_price).toFixed(2)}`,
                  price: `$${parseFloat(updatedItem.price).toFixed(2)}`
                }
              : item
          );
          
          setInventory(updatedInventory);
          setShowAddModal(false);
          setFormData({ name: '', category: '', stock: '', cost_price: '', price: '' });
          setIsCreatingNewItem(false);
        } else {
          // Create new item
          const newItem = await itemsAPI.create({
            name: formData.name,
            category: formData.category,
            stock: parseInt(formData.stock),
            cost_price: parseFloat(formData.cost_price.replace('$', '')),
            price: parseFloat(formData.price.replace('$', ''))
          });
          
          const formattedItem = {
            id: newItem.id,
            name: newItem.name,
            category: newItem.category,
            stock: newItem.stock,
            cost_price: `$${parseFloat(newItem.cost_price).toFixed(2)}`,
            price: `$${parseFloat(newItem.price).toFixed(2)}`
          };
          
          setInventory([...inventory, formattedItem]);
          setShowAddModal(false);
          setFormData({ name: '', category: '', stock: '', cost_price: '', price: '' });
          setIsCreatingNewItem(false);
        }
      } catch (err) {
        console.error('Error adding item:', err);
        alert('Failed to add item');
      }
    }
  };

  const handleConfirmRemove = async () => {
    try {
      const itemsToDelete = [];
      selectedItems.forEach(index => {
        itemsToDelete.push(inventory[index].id);
      });
      
      await Promise.all(itemsToDelete.map(id => itemsAPI.delete(id)));
      
      setInventory(inventory.filter((_, index) => !selectedItems.has(index)));
      setShowRemoveModal(false);
      setSelectedItems(new Set());
    } catch (err) {
      console.error('Error removing items:', err);
      alert('Failed to remove items');
    }
  };

  const handleConfirmEdit = async () => {
    if (formData.name && formData.category && formData.stock && formData.cost_price && formData.price) {
      // Validate that cost price is less than selling price
      const costPrice = parseFloat(formData.cost_price.replace('$', ''));
      const sellingPrice = parseFloat(formData.price.replace('$', ''));
      
      if (costPrice >= sellingPrice) {
        alert('Cost Price must be less than Selling Price!');
        return;
      }

      try {
        const updatedItem = await itemsAPI.update(editingItemId, {
          name: formData.name,
          category: formData.category,
          stock: parseInt(formData.stock),
          cost_price: costPrice,
          price: sellingPrice
        });

        // Update the inventory in state
        const updatedInventory = inventory.map(item =>
          item.id === editingItemId
            ? {
                id: updatedItem.id,
                name: updatedItem.name,
                category: updatedItem.category,
                stock: updatedItem.stock,
                cost_price: `$${parseFloat(updatedItem.cost_price).toFixed(2)}`,
                price: `$${parseFloat(updatedItem.price).toFixed(2)}`
              }
            : item
        );

        setInventory(updatedInventory);
        setShowEditModal(false);
        setEditingItemId(null);
        setFormData({ name: '', category: '', stock: '', cost_price: '', price: '' });
      } catch (err) {
        console.error('Error updating item:', err);
        alert('Failed to update item');
      }
    } else {
      alert('Please fill in all fields');
    }
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
            {error && <p style={{color: 'red'}}>{error}</p>}
          </div>
        </header>

        <div className="table-container">
          {loading ? (
            <div style={{textAlign: 'center', padding: '40px', fontSize: '18px', color: '#6b7280'}}>
              Loading items from database...
            </div>
          ) : (
            <>
          <div className="table-controls">
            <button className="action-btn add-btn" onClick={handleAddClick}>Add</button>
            <button className="action-btn edit-btn" onClick={() => {
              if (selectedItems.size === 0) {
                alert('Please select an item to edit');
                return;
              }
              if (selectedItems.size > 1) {
                alert('Please select only one item to edit');
                return;
              }
              
              const selectedIndex = Array.from(selectedItems)[0];
              const item = inventory[selectedIndex];
              
              setEditingItemId(item.id);
              setFormData({
                name: item.name,
                category: item.category,
                stock: item.stock,
                cost_price: item.cost_price.replace('$', ''),
                price: item.price.replace('$', '')
              });
              setShowEditModal(true);
            }}>Edit</button>
            <button className="action-btn remove-btn" onClick={handleRemoveClick}>Remove</button>
          </div>

          <table className="inventory-table">
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    checked={selectedItems.size === inventory.length && inventory.length > 0}
                    onChange={handleSelectAll}
                    className="checkbox-header"
                  />
                </th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, index) => (
                  <tr 
                    key={item.id}
                    className={selectedItems.has(index) ? 'selected-row' : ''}
                  >
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedItems.has(index)}
                        onChange={() => handleCheckboxChange(index)}
                        className="checkbox-item"
                      />
                    </td>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>{item.stock}</td>
                    <td>{item.cost_price}</td>
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
            </>
          )}
        </div>

        {/* Add Item Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Add New Item</h2>
              <div className="form-group">
                <label>Item Name</label>
                {!isCreatingNewItem ? (
                  <select 
                    value={formData.name}
                    onChange={(e) => {
                      if (e.target.value === 'other') {
                        setIsCreatingNewItem(true);
                        setFormData({...formData, name: '', category: '', cost_price: '', price: ''});
                      } else {
                        // Find the selected item and populate its details
                        const selectedItem = inventory.find(item => item.name === e.target.value);
                        if (selectedItem) {
                          setFormData({
                            ...formData, 
                            name: e.target.value,
                            category: selectedItem.category,
                            cost_price: selectedItem.cost_price,
                            price: selectedItem.price
                          });
                        }
                      }
                    }}
                  >
                    <option value="">Select an existing item</option>
                    {inventory.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                    <option value="other">+ Create New Item</option>
                  </select>
                ) : (
                  <div>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter new item name"
                    />
                    <button 
                      onClick={() => setIsCreatingNewItem(false)}
                      style={{marginTop: '10px', padding: '5px 10px', cursor: 'pointer'}}
                    >
                      Back to existing items
                    </button>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  disabled={!isCreatingNewItem && formData.name}
                >
                  <option value="">Select a category</option>
                  <option value="Ingredients">Ingredients</option>
                </select>
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
                <label>Cost Price</label>
                <input 
                  type="text" 
                  value={formData.cost_price}
                  onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                  disabled={!isCreatingNewItem && formData.name}
                  placeholder="$0.00"
                />
              </div>
              <div className="form-group">
                <label>Selling Price</label>
                <input 
                  type="text" 
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  disabled={!isCreatingNewItem && formData.name}
                  placeholder="$0.00"
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
              <p>Are you sure you want to remove {selectedItems.size} item(s)?</p>
              <div className="items-to-remove">
                {Array.from(selectedItems).map((index) => (
                  <div key={inventory[index]?.id} className="item-to-remove">
                    • {inventory[index]?.name} - {inventory[index]?.category}
                  </div>
                ))}
              </div>
              <div className="modal-buttons">
                <button className="btn-confirm btn-danger" onClick={handleConfirmRemove}>Remove {selectedItems.size} Item(s)</button>
                <button className="btn-cancel" onClick={() => setShowRemoveModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Item Modal */}
        {showEditModal && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Edit Item</h2>
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
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="">Select a category</option>
                  <option value="Ingredients">Ingredients</option>
                </select>
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
                <label>Cost Price</label>
                <input 
                  type="text" 
                  value={formData.cost_price}
                  onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                  placeholder="$0.00"
                />
              </div>
              <div className="form-group">
                <label>Selling Price</label>
                <input 
                  type="text" 
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="$0.00"
                />
              </div>
              <div className="modal-buttons">
                <button className="btn-confirm" onClick={handleConfirmEdit}>Update Item</button>
                <button className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Items;
