import React, { memo } from 'react';

/**
 * EditSaleModal
 * -------------
 * Modal form for editing an existing sale record.
 * Allows changing the item, quantity, total, status, and date.
 *
 * Props:
 *   items            - All inventory items (for the item dropdown)
 *   formData         - Current form field values pre-filled from the sale being edited
 *   handleFormChange - Generic input change handler
 *   handleConfirmEdit- Called when user clicks "Update Sale"
 *   onClose          - Closes the modal
 */
function EditSaleModal({ items, formData, handleFormChange, handleConfirmEdit, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Sale</h2>

        {/* ── Item selector ── */}
        <div className="form-group">
          <label>Item</label>
          <select name="item" value={formData.item} onChange={handleFormChange}>
            <option value="">Select an item</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>

        {/* ── Quantity ── */}
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

        {/* ── Total ── */}
        <div className="form-group">
          <label>Total Price</label>
          <input
            type="number"
            name="total"
            value={formData.total}
            onChange={handleFormChange}
            placeholder="Total price"
            step="0.01"
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

        {/* ── Date & Time ── */}
        <div className="form-group">
          <label>Date &amp; Time</label>
          <input
            type="datetime-local"
            name="date"
            value={formData.date || ''}
            onChange={handleFormChange}
          />
        </div>

        <div className="modal-buttons">
          <button className="btn-confirm" onClick={handleConfirmEdit}>Update Sale</button>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default memo(EditSaleModal);
