import React from 'react';
import { itemsAPI } from '../../api';
import './Modal.css';
import './RemoveItemModal.css';

/**
 * RemoveItemModal
 * ---------------
 * Confirmation dialog shown before deleting one or more inventory items.
 * Lists all the items that are about to be deleted so the user can verify,
 * then sends DELETE requests to the backend for each one.
 *
 * Note: Items that are used in recipes cannot reach this modal — they are
 * blocked earlier in items.js (handleRemoveClick) before this modal opens.
 *
 * Props:
 *   selectedItems - A Set of table row indexes that are checked for removal
 *   inventory     - The full inventory array (used to look up item names/categories by index)
 *   onConfirm     - Callback fired after all items are successfully deleted
 *                   so the parent can remove them from the inventory state
 *   onClose       - Callback fired when the modal should close without deleting
 */
function RemoveItemModal({ selectedItems, inventory, onConfirm, onClose }) {

  // Called when the user clicks the red "Remove X Item(s)" button
  const handleConfirm = async () => {
    try {
      // Build an array of database IDs from the selected row indexes
      const itemsToDelete = [];
      selectedItems.forEach(index => itemsToDelete.push(inventory[index].id));

      // Fire all DELETE requests in parallel for efficiency
      await Promise.all(itemsToDelete.map(id => itemsAPI.delete(id)));

      // Notify the parent — it will filter these items out of the inventory state
      onConfirm();
    } catch (err) {
      console.error('Error removing items:', err);
      alert('Failed to remove items');
    }
  };

  return (
    // Clicking the dark backdrop closes the modal without deleting
    <div className="modal-overlay" onClick={onClose}>
      {/* stopPropagation prevents clicks inside the card from closing the modal */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Confirm Removal</h2>
        <p>Are you sure you want to remove {selectedItems.size} item(s)?</p>

        {/* List of items that will be deleted so the user can double-check */}
        <div className="items-to-remove">
          {Array.from(selectedItems).map((index) => (
            <div key={inventory[index]?.id} className="item-to-remove">
              • {inventory[index]?.name} - {inventory[index]?.category}
            </div>
          ))}
        </div>

        {/* ── Action Buttons ── */}
        <div className="modal-buttons">
          {/* Red "danger" style to make it clear this is a destructive action */}
          <button className="btn-confirm btn-danger" onClick={handleConfirm}>
            Remove {selectedItems.size} Item(s)
          </button>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default RemoveItemModal;
