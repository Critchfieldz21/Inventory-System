import React, { useState } from 'react';
import { itemsAPI, expensesAPI } from '../../api';
import SearchableSelect from './SearchableSelect';
import './Modal.css';

/**
 * AddItemModal
 * ------------
 * Modal form for adding inventory items.
 *
 * Two modes:
 *   1. "Add stock to existing item" — user searches and picks an item that already
 *      exists in the database. Only the stock quantity can be changed; name, category,
 *      and prices are locked to whatever is already on record.
 *   2. "Create new item" — user types a brand-new name, picks/creates a category,
 *      and fills in all fields from scratch.
 *
 * Props:
 *   inventory       - Full list of existing inventory items (used for the search dropdown)
 *   categories      - List of category strings available to choose from
 *   onCategoryAdded - Callback(newCategoryString) — called when user creates a new category
 *                     so the parent can add it to the shared categories list
 *   onSave          - Callback(savedItem, isUpdate) — called after a successful API save.
 *                     isUpdate=true means an existing item's stock was increased.
 *                     isUpdate=false means a brand-new item was created.
 *   onClose         - Callback fired when the modal should close (cancel or backdrop click)
 */
function AddItemModal({ inventory, categories, onCategoryAdded, onSave, onClose }) {
  // All the form field values — start empty
  const [formData, setFormData] = useState({ name: '', category: '', stock: '', cost_price: '', price: '' });

  // true  = user is typing a brand-new item name
  // false = user is picking from existing items via the search dropdown
  const [isCreatingNewItem, setIsCreatingNewItem] = useState(false);

  // Controls whether the "add new category" text input row is visible
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  // Holds the text the user types when creating a new category
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // --- Handlers ---

  // Reset the new-category sub-form and call the parent's onClose
  const handleClose = () => {
    setShowNewCategoryInput(false);
    setNewCategoryInput('');
    onClose();
  };

  // Called when the user clicks "Add Item" — validates, calls the API, then notifies parent
  const handleConfirm = async () => {
    // Don't submit if any field is empty
    if (!formData.name || !formData.category || !formData.stock || !formData.cost_price || !formData.price) return;

    // Strip any leading "$" the user may have typed before parsing as numbers
    const costPrice = parseFloat(formData.cost_price.replace('$', ''));
    const sellingPrice = parseFloat(formData.price.replace('$', ''));

    try {
      // Check if an item with this name already exists in inventory
      const existingItem = inventory.find(item => item.name === formData.name);

      if (existingItem && !isCreatingNewItem) {
        // --- Mode 1: Add stock to an existing item ---
        // We send a PATCH/PUT to update only the stock count (add the entered quantity on top)
        const quantityAdded = parseInt(formData.stock);
        const itemCostPrice = parseFloat(String(existingItem.cost_price).replace('$', ''));

        const updatedItem = await itemsAPI.update(existingItem.id, {
          name: existingItem.name,
          category: existingItem.category,
          stock: existingItem.stock + quantityAdded, // add new stock on top of current
          cost_price: itemCostPrice,
          price: String(existingItem.price).replace('$', '')
        });

        // Record the purchase expense: cost_price × quantity restocked
        await expensesAPI.create({
          item: existingItem.id,
          quantity: quantityAdded,
          cost_price_at_time: itemCostPrice,
          amount: parseFloat((itemCostPrice * quantityAdded).toFixed(2)),
          description: `Restock — ${existingItem.name} × ${quantityAdded}`,
        });

        // Send the formatted updated item back to the parent so the table refreshes
        onSave({
          id: updatedItem.id,
          name: updatedItem.name,
          category: updatedItem.category,
          stock: updatedItem.stock,
          cost_price: `$${parseFloat(updatedItem.cost_price).toFixed(2)}`,
          price: `$${parseFloat(updatedItem.price).toFixed(2)}`
        }, true); // true = this was an update, not a create

      } else {
        // --- Mode 2: Create a brand-new item ---
        const quantity = parseInt(formData.stock);

        const newItem = await itemsAPI.create({
          name: formData.name,
          category: formData.category,
          stock: quantity,
          cost_price: costPrice,
          price: sellingPrice
        });

        // Record the purchase expense: cost_price × initial stock
        await expensesAPI.create({
          item: newItem.id,
          quantity: quantity,
          cost_price_at_time: costPrice,
          amount: parseFloat((costPrice * quantity).toFixed(2)),
          description: `Initial stock — ${formData.name} × ${quantity}`,
        });

        // Send the formatted new item back to the parent so it appears in the table
        onSave({
          id: newItem.id,
          name: newItem.name,
          category: newItem.category,
          stock: newItem.stock,
          cost_price: `$${parseFloat(newItem.cost_price).toFixed(2)}`,
          price: `$${parseFloat(newItem.price).toFixed(2)}`
        }, false); // false = this was a create, not an update
      }

      handleClose();
    } catch (err) {
      console.error('Error adding item:', err);
      alert('Failed to add item');
    }
  };

  // Called when the user clicks "Add" inside the new-category sub-form
  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    // Only add if it's non-empty and not already in the list
    if (trimmed && !categories.includes(trimmed)) onCategoryAdded(trimmed);
    // Also auto-select the new category in the form
    if (trimmed) setFormData({ ...formData, category: trimmed });
    // Reset and hide the sub-form
    setNewCategoryInput('');
    setShowNewCategoryInput(false);
  };

  // Live price-warning calculation — show a warning if cost >= selling price
  const cost = parseFloat(String(formData.cost_price).replace('$', ''));
  const sell = parseFloat(String(formData.price).replace('$', ''));
  const showPriceWarning = !isNaN(cost) && !isNaN(sell) && cost >= sell;

  // --- Render ---
  return (
    // Clicking the dark backdrop closes the modal
    <div className="modal-overlay" onClick={handleClose}>
      {/* stopPropagation prevents clicks inside the card from bubbling to the backdrop */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Add New Item</h2>

        {/* ── Item Name Field ── */}
        <div className="form-group">
          <label>Item Name</label>

          {/* Mode toggle: search existing vs. type new */}
          {!isCreatingNewItem ? (
            <div>
              {/* Searchable dropdown that pre-fills the form when an existing item is picked */}
              <SearchableSelect
                options={inventory}
                value={formData.name ? inventory.find(i => i.name === formData.name)?.id ?? '' : ''}
                onChange={(val) => {
                  const selectedItem = inventory.find(item => item.id === parseInt(val));
                  if (selectedItem) {
                    // Auto-fill all fields from the existing item's data
                    setFormData({ ...formData, name: selectedItem.name, category: selectedItem.category, cost_price: selectedItem.cost_price, price: selectedItem.price });
                  }
                }}
                placeholder="Search for an existing item..."
                displayKey="name"
                valueKey="id"
              />
              {/* Switch to new-item mode */}
              <button
                className="btn-create-new-item"
                onClick={() => { setIsCreatingNewItem(true); setFormData({ ...formData, name: '', category: '', cost_price: '', price: '' }); }}
              >
                + Create New Item
              </button>
            </div>
          ) : (
            /* Free-text input for a brand-new item name */
            <div className="new-item-name-group">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter new item name"
              />
              {/* Switch back to searching existing items */}
              <button className="btn-back-to-existing" onClick={() => setIsCreatingNewItem(false)}>
                ← Back to existing items
              </button>
            </div>
          )}
        </div>

        {/* ── Category Field ── */}
        <div className="form-group">
          <label>Category</label>
          {/* Category is locked (disabled) when picking an existing item — it can't be changed here */}
          <SearchableSelect
            options={categories.map(cat => ({ label: cat, value: cat }))}
            value={formData.category}
            onChange={(val) => setFormData({ ...formData, category: val })}
            placeholder="Select a category..."
            displayKey="label"
            valueKey="value"
            disabled={!isCreatingNewItem && !!formData.name}
          />

          {/* Button to reveal the "add new category" sub-form */}
          {!showNewCategoryInput && (
            <button className="btn-create-new-item" onClick={() => setShowNewCategoryInput(true)}>
              + Add New Category
            </button>
          )}

          {/* Inline sub-form for typing and confirming a new category name */}
          {showNewCategoryInput && (
            <div className="new-category-input-group">
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                placeholder="Enter new category name"
                autoFocus
              />
              <div className="new-category-buttons">
                <button className="btn-add-category" onClick={handleAddCategory}>Add</button>
                <button className="btn-cancel-category" onClick={() => { setNewCategoryInput(''); setShowNewCategoryInput(false); }}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Stock Field ── */}
        <div className="form-group">
          <label>Stock</label>
          <input
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            placeholder="Enter stock quantity"
          />
        </div>

        {/* ── Cost Price Field ── */}
        {/* Locked when adding stock to an existing item — cost price stays as-is */}
        <div className="form-group">
          <label>Cost Price</label>
          <input
            type="text"
            value={formData.cost_price}
            onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
            disabled={!isCreatingNewItem && !!formData.name}
            placeholder="$0.00"
          />
        </div>

        {/* ── Selling Price Field ── */}
        {/* Also locked when adding stock to an existing item */}
        <div className="form-group">
          <label>Selling Price</label>
          <input
            type="text"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            disabled={!isCreatingNewItem && !!formData.name}
            placeholder="$0.00"
          />
          {/* Show a soft warning (not a blocker) if cost >= selling price */}
          {showPriceWarning && (
            <div className="price-warning">
              Cost price must be <strong>less than</strong> the selling price
            </div>
          )}
        </div>

        {/* ── Action Buttons ── */}
        <div className="modal-buttons">
          <button className="btn-confirm" onClick={handleConfirm}>Add Item</button>
          <button className="btn-cancel" onClick={handleClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default AddItemModal;
