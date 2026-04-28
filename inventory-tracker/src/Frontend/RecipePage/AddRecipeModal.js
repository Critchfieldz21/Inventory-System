import React, { useMemo } from 'react';

/**
 * AddRecipeModal
 * --------------
 * Modal form for creating a new recipe.
 * Users pick ingredients from inventory via a searchable button list,
 * then set quantities for each one.
 *
 * Props:
 *   items                        - All inventory items (used for the ingredient picker)
 *   formData                     - Current form values { name, ingredients[] }
 *   setFormData                  - Setter for formData
 *   ingredientSearch             - Current text in the ingredient search input
 *   setIngredientSearch          - Setter for ingredientSearch
 *   handleAddIngredient          - Adds an ingredient by name to formData.ingredients
 *   handleRemoveIngredient       - Removes an ingredient by index
 *   handleUpdateIngredientQuantity - Updates the quantity for an ingredient by index
 *   handleConfirmAdd             - Called when user clicks "Add Recipe"
 *   onClose                      - Closes the modal
 */
function AddRecipeModal({
  items,
  formData,
  setFormData,
  ingredientSearch,
  setIngredientSearch,
  handleAddIngredient,
  handleRemoveIngredient,
  handleUpdateIngredientQuantity,
  handleConfirmAdd,
  onClose,
}) {
  const handleClose = () => {
    setIngredientSearch('');
    onClose();
  };

  // Memoize filtered ingredient list — items.filter was previously called twice in JSX
  const filteredIngredients = useMemo(() =>
    items.filter(item => item.name.toLowerCase().includes(ingredientSearch.toLowerCase())),
    [items, ingredientSearch]
  );

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Add New Recipe</h2>

        {/* ── Recipe Name ── */}
        <div className="form-group">
          <label>Recipe Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter recipe name"
          />
        </div>

        {/* ── Ingredient Picker ── */}
        <div className="form-group">
          <label>Select Ingredients from Inventory</label>
          <input
            type="text"
            className="ingredient-search"
            placeholder="Search ingredients..."
            value={ingredientSearch}
            onChange={(e) => setIngredientSearch(e.target.value)}
          />
          <div className="ingredient-selector">
            {filteredIngredients.map((item) => (
                <button
                  key={item.id}
                  className="ingredient-btn"
                  onClick={() => handleAddIngredient(item.name)}
                  disabled={!!formData.ingredients.find(ing => ing.name === item.name)}
                >
                  + {item.name}
                </button>
              ))}
            {filteredIngredients.length === 0 && (
              <p className="ingredient-no-results">No ingredients match "{ingredientSearch}"</p>
            )}
          </div>
        </div>

        {/* ── Selected Ingredients with Quantities ── */}
        <div className="form-group">
          <label>Recipe Ingredients</label>
          {formData.ingredients.length > 0 ? (
            <div className="ingredients-list">
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="ingredient-row">
                  <input
                    type="number"
                    min="1"
                    value={ingredient.quantity}
                    onChange={(e) => handleUpdateIngredientQuantity(index, e.target.value)}
                    className="ingredient-quantity"
                  />
                  <span className="ingredient-name">{ingredient.name}</span>
                  <button
                    className="btn-remove-ingredient"
                    onClick={() => handleRemoveIngredient(index)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              No ingredients added yet. Click the buttons above to add ingredients.
            </p>
          )}
        </div>

        <div className="modal-buttons">
          <button className="btn-confirm" onClick={handleConfirmAdd}>Add Recipe</button>
          <button className="btn-cancel" onClick={handleClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default AddRecipeModal;
