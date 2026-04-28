import React, { useMemo } from 'react';
import SalesSearchableSelect from './SalesSearchableSelect';

/**
 * AddSaleModal
 * ------------
 * Modal form for creating a new sale.
 * Supports two modes: selling a single Item, or selling a Recipe (which
 * deducts all its ingredients from inventory at once).
 *
 * Props:
 *   items                       - All inventory items (for the item dropdown)
 *   recipes                     - All recipes (for the recipe dropdown)
 *   formData                    - Current form field values
 *   setFormData                 - Setter for formData
 *   saleType                    - 'item' | 'recipe'
 *   setSaleType                 - Setter for saleType
 *   selectedRecipeIngredients   - Raw ingredient string/JSON for the chosen recipe
 *   setSelectedRecipeIngredients- Setter for selectedRecipeIngredients
 *   handleConfirmAdd            - Called when user clicks "Add Sale"
 *   handleFormChange            - Generic input change handler
 *   handleRecipeChange          - Called when a recipe is selected from the dropdown
 *   parseRecipeIngredients      - Parses ingredient JSON/string into a usable array
 *   calculateRecipeTotal        - Returns the auto-calculated total for the recipe
 *   onClose                     - Closes the modal
 */
function AddSaleModal({
  items,
  recipes,
  formData,
  setFormData,
  saleType,
  setSaleType,
  selectedRecipeIngredients,
  setSelectedRecipeIngredients,
  handleConfirmAdd,
  handleFormChange,
  handleRecipeChange,
  parseRecipeIngredients,
  onClose,
}) {
  // Reset form and sale type when switching between Item and Recipe modes
  const switchMode = (mode) => {
    setSaleType(mode);
    setFormData({ item: '', quantity: '', total: '', status: 'Completed' });
    setSelectedRecipeIngredients([]);
  };

  // Parse and enrich ingredient list once — avoids re-parsing on every render
  const parsedIngredients = useMemo(() => {
    if (!selectedRecipeIngredients) return [];
    const list = parseRecipeIngredients(selectedRecipeIngredients);
    return list.map(ing => {
      const ingredientItem = items.find(
        item => item.name.toLowerCase() === ing.name.toLowerCase()
      );
      return { ...ing, ingredientItem };
    });
  }, [selectedRecipeIngredients, parseRecipeIngredients, items]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-sale-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Add New Sale</h2>

        {/* ── Sale Type Toggle ── */}
        <div className="form-group">
          <label>Sale Type</label>
          <div className="sale-type-toggle">
            <button
              className={`toggle-btn ${saleType === 'item' ? 'active' : ''}`}
              onClick={() => switchMode('item')}
            >
              Item
            </button>
            <button
              className={`toggle-btn ${saleType === 'recipe' ? 'active' : ''}`}
              onClick={() => switchMode('recipe')}
            >
              Recipe
            </button>
          </div>
        </div>

        {saleType === 'item' ? (
          /* ── Item Mode ── */
          <>
            <div className="form-group">
              <label>Item</label>
              <SalesSearchableSelect
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
          /* ── Recipe Mode ── */
          <>
            <div className="form-group">
              <label>Recipe</label>
              <SalesSearchableSelect
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

            {/* Ingredients breakdown with stock warnings */}
            {selectedRecipeIngredients !== undefined && selectedRecipeIngredients !== null && (
              <div className="form-group">
                <label>Ingredients Required:</label>
                <div className="ingredients-list">
                  {parsedIngredients.length === 0 ? (
                    <div className="no-ingredients">No ingredients added to this recipe</div>
                  ) : parsedIngredients.map((ing, index) => {
                    const requiredQty = ing.quantity * (parseInt(formData.quantity) || 1);
                    const hasEnough = ing.ingredientItem && requiredQty <= ing.ingredientItem.stock;
                    return (
                      <div key={index} className={`ingredient-item ${hasEnough ? '' : 'insufficient'}`}>
                        <span>{requiredQty}x {ing.name}</span>
                        <span className={`ingredient-stock ${!hasEnough ? 'warning' : ''}`}>
                          Available: {ing.ingredientItem?.stock || 0}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Auto-calculated Total ── */}
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

        {/* ── Status ── */}
        <div className="form-group">
          <label>Status</label>
          <select name="status" value={formData.status} onChange={handleFormChange}>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="modal-buttons">
          <button className="btn-confirm" onClick={handleConfirmAdd}>Add Sale</button>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default AddSaleModal;
