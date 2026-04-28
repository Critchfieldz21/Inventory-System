import React, { memo } from 'react';

/**
 * RemoveSaleModal
 * ---------------
 * Confirmation dialog shown before deleting one or more sales.
 * Lists each selected sale so the user can verify before confirming.
 *
 * Props:
 *   selectedRows       - Set of row indices the user has checked
 *   salesData          - Full array of sales (used to look up names by index)
 *   handleConfirmRemove- Called when the user confirms deletion
 *   onClose            - Closes the modal without deleting
 */
function RemoveSaleModal({ selectedRows, salesData, handleConfirmRemove, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Confirm Removal</h2>
        <p>Are you sure you want to remove {selectedRows.size} sale(s)?</p>

        {/* List the sales that will be deleted */}
        <div className="items-to-remove">
          {Array.from(selectedRows).map((index) => (
            <div key={salesData[index]?.id} className="item-to-remove">
              • Order ID: {salesData[index]?.id} — {salesData[index]?.item_name || salesData[index]?.item}
            </div>
          ))}
        </div>

        <div className="modal-buttons">
          <button className="btn-confirm btn-danger" onClick={handleConfirmRemove}>
            Remove {selectedRows.size} Sale(s)
          </button>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default memo(RemoveSaleModal);
