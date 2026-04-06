import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './items.css';

// Sample recipes data
const RECIPES = [
  {
    id: 1,
    name: 'Classic Burger',
    ingredients: '1 Burger Bun, 1 Beef Patty, 1 Cheddar Cheese, Lettuce, Tomato, Ketchup'
  },
  {
    id: 2,
    name: 'Bacon Cheeseburger',
    ingredients: '1 Burger Bun, 1 Beef Patty, 1 Bacon Strips, 1 Cheddar Cheese, Lettuce, Mayonnaise'
  },
  {
    id: 3,
    name: 'Chicken Burger',
    ingredients: '1 Burger Bun, 1 Chicken Breast, 1 Cheddar Cheese, Lettuce, Tomato'
  },
];

// Item names used in recipes
const ITEM_NAMES = [
  'Burger Buns', 'Beef Patties', 'Cheddar Cheese',
  'Lettuce', 'Tomato', 'Mayonnaise', 'Ketchup', 'Bacon Strips', 'Chicken Breast'
];

function Items() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [recipes, setRecipes] = useState(RECIPES);
  const [inventory, setInventory] = useState([
    { id: 1, name: 'Burger Buns', category: 'Bread', stock: 45, price: '$0.50' },
    { id: 2, name: 'Beef Patties', category: 'Meat', stock: 38, price: '$2.50' },
    { id: 3, name: 'Cheddar Cheese', category: 'Cheese', stock: 32, price: '$0.75' },
    { id: 4, name: 'Lettuce', category: 'Vegetables', stock: 15, price: '$0.30' },
    { id: 5, name: 'Tomato', category: 'Vegetables', stock: 22, price: '$0.40' },
    { id: 6, name: 'Mayonnaise', category: 'Condiments', stock: 18, price: '$0.20' },
    { id: 7, name: 'Ketchup', category: 'Condiments', stock: 25, price: '$0.15' },
    { id: 8, name: 'Bacon Strips', category: 'Meat', stock: 16, price: '$1.50' },
    { id: 9, name: 'Chicken Breast', category: 'Meat', stock: 24, price: '$3.00' },
    { id: 10, name: 'Tomato Sauce', category: 'Condiments', stock: 12, price: '$0.35' },
  ]);

  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [itemsInRecipes, setItemsInRecipes] = useState(new Set());
  const [blockedReason, setBlockedReason] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    stock: '',
    price: ''
  });

  const handleAddClick = () => {
    setFormData({ name: '', category: '', stock: '', price: '' });
    setShowAddModal(true);
  };

  const getItemsInRecipes = () => {
    const itemsUsed = new Set();
    recipes.forEach(recipe => {
      ITEM_NAMES.forEach(itemName => {
        if (recipe.ingredients.includes(itemName)) {
          itemsUsed.add(itemName);
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

    setBlockedReason('');
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
    setInventory(inventory.filter((_, index) => !selectedItems.has(index)));
    setShowRemoveModal(false);
    setSelectedItems(new Set());
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
      </main>
    </div>
  );
}

export default Items;
