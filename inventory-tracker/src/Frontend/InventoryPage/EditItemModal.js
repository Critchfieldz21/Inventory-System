import React, { useState, useMemo } from 'react';
import { itemsAPI } from '../../api';
import SearchableSelect from './SearchableSelect';
import './Modal.css';

/**
 * EditItemModal
 * -------------
 * Modal form for editing an existing inventory item.
 * Unlike AddItemModal, every field is editable here — the user can change
 * the name, category, stock, cost price, and selling price freely.
 *
 * Props:
 *   item            - The item object being edited (pre-populates all fields)
 *   categories      - List of category strings available to choose from
 *   onCategoryAdded - Callback(newCategoryString) — called when user creates a new category
 *                     so the parent can keep the shared categories list up to date
 *   onSave          - Callback(updatedItem) — called after a successful API save
 *                     with the newly formatted item object so the table can update
 *   onClose         - Callback fired when the modal should close (cancel or backdrop click)
 */
function EditItemModal({ item, categories, onCategoryAdded, onSave, onClose }) {
  // Pre-populate formData with the existing item's values.
  // Strip the "$" from prices so the inputs show plain numbers like "12.50"
  const [formData, setFormData] = useState({
    name: item.name,
    category: item.category,
    stock: item.stock,
    cost_price: item.cost_price.replace('$', ''),
    price: item.price.replace('$', '')
  });

  // Controls whether the "add new category" text input row is visible
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  // Holds the text the user types when creating a new category
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // --- Handlers ---

  // Reset sub-form state and call parent's onClose
  const handleClose = () => {
    setShowNewCategoryInput(false);
    setNewCategoryInput('');
    onClose();
  };

  // Called when the user clicks "Update Item" — validates, calls the API, then notifies parent
  const handleConfirm = async () => {
    // Don't submit if any field is empty
    if (!formData.name || !formData.category || !formData.stock || !formData.cost_price || !formData.price) {
      alert('Please fill in all fields');
      return;
    }

    // Strip any "$" signs before sending to the API
    const costPrice = parseFloat(formData.cost_price.replace('$', ''));
    const sellingPrice = parseFloat(formData.price.replace('$', ''));

    try {
      // Send the updated data to the backend using the item's existing ID
      const updatedItem = await itemsAPI.update(item.id, {
        name: formData.name,
        category: formData.category,
        stock: parseInt(formData.stock),
        cost_price: costPrice,
        price: sellingPrice
      });

      // Format the response back into the "$X.XX" style the table expects
      onSave({
        id: updatedItem.id,
        name: updatedItem.name,
        category: updatedItem.category,
        stock: updatedItem.stock,
        cost_price: `$${parseFloat(updatedItem.cost_price).toFixed(2)}`,
        price: `$${parseFloat(updatedItem.price).toFixed(2)}`
      });

      handleClose();
    } catch (err) {
      console.error('Error updating item:', err);
      alert('Failed to update item');
    }
  };

  // Called when the user clicks "Add" inside the new-category sub-form
  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    // Only add if non-empty and not a duplicate
    if (trimmed && !categories.includes(trimmed)) onCategoryAdded(trimmed);
    // Auto-select the newly created category in the form
    if (trimmed) setFormData({ ...formData, category: trimmed });
    // Reset and hide the sub-form
    setNewCategoryInput('');
    setShowNewCategoryInput(false);
  };

  // Show a warning if cost price >= selling price — memoized to avoid recalculating on every render
  const showPriceWarning = useMemo(() => {
    const cost = parseFloat(String(formData.cost_price).replace('$', ''));
    const sell = parseFloat(String(formData.price).replace('$', ''));
    return !isNaN(cost) && !isNaN(sell) && cost >= sell;
  }, [formData.cost_price, formData.price]);

  // --- Render ---
  return (
    // Clicking the dark backdrop closes the modal
    <div className="modal-overlay" onClick={handleClose}>
      {/* stopPropagation prevents clicks inside the card from bubbling to the backdrop */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Item</h2>

        {/* ── Item Name Field ── */}
        {/* Plain text input — the user can rename the item freely */}
        <div className="form-group">
          <label>Item Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter item name"
          />
        </div>

        {/* ── Category Field ── */}
        <div className="form-group">
          <label>Category</label>
          {/* Searchable dropdown showing all available categories */}
          <SearchableSelect
            options={categories.map(cat => ({ label: cat, value: cat }))}
            value={formData.category}
            onChange={(val) => setFormData({ ...formData, category: val })}
            placeholder="Select a category..."
            displayKey="label"
            valueKey="value"
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
        <div className="form-group">
          <label>Cost Price</label>
          <input
            type="text"
            value={formData.cost_price}
            onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
            placeholder="$0.00"
          />
        </div>

        {/* ── Selling Price Field ── */}
        <div className="form-group">
          <label>Selling Price</label>
          <input
            type="text"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="$0.00"
          />
          {/* Show a soft warning (not a blocker) if cost >= selling price */}
          {showPriceWarning && (
            <div className="price-warning">
              ⚠️ Cost price must be <strong>less than</strong> the selling price
            </div>
          )}
        </div>

        {/* ── Action Buttons ── */}
        <div className="modal-buttons">
          <button className="btn-confirm" onClick={handleConfirm}>Update Item</button>
          <button className="btn-cancel" onClick={handleClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default EditItemModal;
