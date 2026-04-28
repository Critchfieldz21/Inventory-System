import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { itemsAPI, recipesAPI } from '../../api';
import AddItemModal from './AddItemModal';
import EditItemModal from './EditItemModal';
import RemoveItemModal from './RemoveItemModal';
import './items.css';

/**
 * Items (Inventory Page)
 * ----------------------
 * The main inventory page. Responsible for:
 *   - Fetching and displaying all inventory items in a table
 *   - Managing which rows are selected (checkboxes)
 *   - Opening the Add, Edit, and Remove modals
 *   - Keeping the shared "categories" list in sync across all modals
 *   - Handling XLSX import
 *
 * All the actual form logic and API calls for Add/Edit/Remove
 * live in their own modal component files to keep this file clean.
 */
function Items() {
  const navigate = useNavigate();

  // Hidden file input used to trigger the XLSX import file picker
  const importInputRef = useRef(null);

  // ── Data State ──
  const [recipes, setRecipes] = useState([]);     // All recipes — needed to check if an item is in use
  const [inventory, setInventory] = useState([]); // All inventory items shown in the table
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Selection State ──
  // A Set of row *indexes* (not IDs) that currently have their checkbox ticked
  const [selectedItems, setSelectedItems] = useState(new Set());

  // ── Modal Visibility State ──
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // The full item object passed into EditItemModal so it can pre-populate the form
  const [editingItem, setEditingItem] = useState(null);

  // ── Category State ──
  // Shared list of categories available in Add and Edit modals.
  // Starts with a default and gets merged with any categories already in the DB on load.
  const [categories, setCategories] = useState(['Ingredients']);

  // ─────────────────────────────────────────────
  // Data Loading
  // ─────────────────────────────────────────────

  /**
   * loadData — fetches items and recipes from the backend in parallel.
   * Formats prices into "$X.XX" strings for display, and merges any
   * categories already present in the DB into the local categories list.
   */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch both at the same time to avoid two sequential waits
      const [itemsData, recipesData] = await Promise.all([
        itemsAPI.getAll(),
        recipesAPI.getAll()
      ]);

      // Handle both paginated responses (Django REST Framework default) and plain arrays
      const itemsArray = Array.isArray(itemsData) ? itemsData : (itemsData.results || []);
      const recipesArray = Array.isArray(recipesData) ? recipesData : (recipesData.results || []);

      // Format each item's prices as "$X.XX" strings for display in the table
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

      // Merge DB categories into the local list, removing duplicates
      const existingCats = [...new Set(itemsArray.map(i => i.category).filter(Boolean))];
      setCategories(prev => [...new Set([...prev, ...existingCats])]);

      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load items and recipes');
    } finally {
      setLoading(false);
    }
  }, []);

  // Run loadData once when the page first loads
  useEffect(() => { loadData(); }, [loadData]);

  // ─────────────────────────────────────────────
  // XLSX Import
  // ─────────────────────────────────────────────

  /**
   * handleImportXlsx — sends the chosen .xlsx file to the backend,
   * then reloads the inventory table with the new/updated items.
   */
  const handleImportXlsx = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = await itemsAPI.importXlsx(file);
      await loadData(); // Refresh the table after import
      alert(`Import complete. Created: ${result.created || 0}, Updated: ${result.updated || 0}, Skipped: ${result.skipped || 0}`);
    } catch (err) {
      console.error('Error importing items xlsx:', err);
      alert('Failed to import items xlsx file');
    } finally {
      // Reset the file input so the same file can be imported again if needed
      event.target.value = '';
    }
  };

  // ─────────────────────────────────────────────
  // Recipe Protection Check
  // ─────────────────────────────────────────────

  /**
   * itemsInRecipes — memoized Set of item names used in at least one recipe.
   * Recalculated only when recipes or inventory changes.
   */
  const itemsInRecipes = useMemo(() => {
    const used = new Set();
    recipes.forEach(recipe => {
      inventory.forEach(item => {
        if (recipe.ingredients.includes(item.name)) used.add(item.name);
      });
    });
    return used;
  }, [recipes, inventory]);

  // ─────────────────────────────────────────────
  // Button Click Handlers
  // ─────────────────────────────────────────────

  /**
   * handleRemoveClick — validates the selection before opening the Remove modal.
   * Blocks removal if no items are selected, or if any selected item is used in a recipe.
   */
  const handleRemoveClick = useCallback(() => {
    if (selectedItems.size === 0) { alert('Please select at least one item to remove'); return; }

    const blockedItems = Array.from(selectedItems).map(i => inventory[i].name).filter(name => itemsInRecipes.has(name));

    if (blockedItems.length > 0) {
      alert(`Cannot remove these items because they are used in recipes:\n\n${blockedItems.join(', ')}\n\nPlease remove the recipes first.`);
      return;
    }

    setShowRemoveModal(true);
  }, [selectedItems, inventory, itemsInRecipes]);

  /**
   * handleEditClick — validates that exactly one item is selected,
   * then passes that item to EditItemModal and opens it.
   */
  const handleEditClick = useCallback(() => {
    if (selectedItems.size === 0) { alert('Please select an item to edit'); return; }
    if (selectedItems.size > 1) { alert('Please select only one item to edit'); return; }

    const selectedIndex = Array.from(selectedItems)[0];
    setEditingItem(inventory[selectedIndex]);
    setShowEditModal(true);
  }, [selectedItems, inventory]);

  // ─────────────────────────────────────────────
  // Checkbox Handlers
  // ─────────────────────────────────────────────

  /**
   * handleCheckboxChange — toggles a single row's selection on/off.
   * Works by adding or removing the row's index from the selectedItems Set.
   */
  const handleCheckboxChange = useCallback((index) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedItems(prev =>
      prev.size === inventory.length
        ? new Set()
        : new Set(inventory.map((_, i) => i))
    );
  }, [inventory]);

  // Filter inventory by search query — memoized so it only reruns when data or query changes
  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) return inventory;
    const q = searchQuery.toLowerCase();
    return inventory.filter(item =>
      (item.name     && item.name.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q))
    );
  }, [inventory, searchQuery]);

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
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

      {/* ── Sidebar Navigation ── */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <h2 className="sidebar-logo">Inventory Tracker</h2>
        <nav className="nav-links">
          <Link to="/home" onClick={() => setSidebarOpen(false)}>Home</Link>
          <Link to="/inventory" className="active" onClick={() => setSidebarOpen(false)}>Inventory</Link>
          <Link to="/sales" onClick={() => setSidebarOpen(false)}>Sales</Link>
          <Link to="/recipe" onClick={() => setSidebarOpen(false)}>Recipes</Link>
        </nav>
        <button onClick={() => navigate('/')} className="logout-btn">Logout</button>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="main-content">
        <header className="content-header item-header">
          <div>
            <h1>Inventory Items</h1>
            {/* Show a red message if the initial data fetch failed */}
            {error && <p style={{ color: 'red' }}>{error}</p>}
          </div>
        </header>

        <div className="table-container">
          {loading ? (
            /* Loading state — shown while API calls are in flight */
            <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#6b7280' }}>
              Loading items from database...
            </div>
          ) : (
            <>
              {/* ── Table Action Buttons ── */}
              <div className="table-controls">
                <button className="action-btn add-btn" onClick={() => setShowAddModal(true)}>Add</button>

                {/* Import XLSX button triggers the hidden file input */}
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

                {/* Search bar — filters by item name or category */}
                <div className="items-search-wrapper">
                  <input
                    type="text"
                    className="items-search-input"
                    placeholder="Search by name or category…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button className="items-search-clear" onClick={() => setSearchQuery('')}>✕</button>
                  )}
                </div>
              </div>

              {/* ── Inventory Table ── */}
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>
                      {/* "Select All" checkbox in the header */}
                      <input
                        type="checkbox"
                        checked={selectedItems.size === filteredInventory.length && filteredInventory.length > 0}
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
                  {filteredInventory.map((item, index) => (
                    <tr key={item.id} className={selectedItems.has(index) ? 'selected-row' : ''}>
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
                        {/* Stock status badge: Low Stock (<10), warning colour (10-19), healthy (20+) */}
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

        {/* ── Add Item Modal ── */}
        {/* Only mounted when showAddModal is true */}
        {showAddModal && (
          <AddItemModal
            inventory={inventory}
            categories={categories}
            // When user creates a new category inside the modal, add it to our shared list
            onCategoryAdded={(cat) => setCategories(prev => [...prev, cat])}
            onSave={(savedItem, isUpdate) => {
              if (isUpdate) {
                // Replace the existing row with the updated data
                setInventory(prev => prev.map(i => i.id === savedItem.id ? savedItem : i));
              } else {
                // Append the new item to the end of the table
                setInventory(prev => [...prev, savedItem]);
              }
            }}
            onClose={() => setShowAddModal(false)}
          />
        )}

        {/* ── Remove Item Modal ── */}
        {/* Only mounted when showRemoveModal is true */}
        {showRemoveModal && (
          <RemoveItemModal
            selectedItems={selectedItems}
            inventory={inventory}
            onConfirm={() => {
              // Filter out all the rows whose indexes were in selectedItems
              setInventory(inventory.filter((_, index) => !selectedItems.has(index)));
              setSelectedItems(new Set()); // Clear the selection
              setShowRemoveModal(false);
            }}
            onClose={() => setShowRemoveModal(false)}
          />
        )}

        {/* ── Edit Item Modal ── */}
        {/* Only mounted when showEditModal is true AND we have an item to edit */}
        {showEditModal && editingItem && (
          <EditItemModal
            item={editingItem}
            categories={categories}
            // When user creates a new category inside the modal, add it to our shared list
            onCategoryAdded={(cat) => setCategories(prev => [...prev, cat])}
            onSave={(updatedItem) => {
              // Replace the matching row in the table with the updated data
              setInventory(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
            }}
            onClose={() => { setShowEditModal(false); setEditingItem(null); }}
          />
        )}
      </main>
    </div>
  );
}

export default Items;
