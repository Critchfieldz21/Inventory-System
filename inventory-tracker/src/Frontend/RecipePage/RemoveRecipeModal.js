import React, { memo } from 'react';

/**
 * RemoveRecipeModal
 * -----------------
 * Confirmation dialog shown before deleting one or more recipes.
 * Lists each selected recipe name so the user can verify before confirming.
 *
 * Props:
 *   selectedRecipes    - Set of recipe IDs the user has checked
 *   recipes            - Full array of recipes (used to look up names by ID)
 *   handleConfirmRemove- Called when the user confirms deletion
 *   onClose            - Closes the modal without deleting
 */
function RemoveRecipeModal({ selectedRecipes, recipes, handleConfirmRemove, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Confirm Removal</h2>
        <p>Are you sure you want to remove {selectedRecipes.size} recipe(s)?</p>

        {/* List the recipes that will be deleted */}
        <div className="items-to-remove">
          {recipes
            .filter(r => selectedRecipes.has(r.id))
            .map((r) => (
              <div key={r.id} className="item-to-remove">
                • {r.name}
              </div>
            ))}
        </div>

        <div className="modal-buttons">
          <button className="btn-confirm btn-danger" onClick={handleConfirmRemove}>
            Remove {selectedRecipes.size} Recipe(s)
          </button>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default memo(RemoveRecipeModal);
