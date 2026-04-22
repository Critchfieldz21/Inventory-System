import React, { useState, useEffect, useRef, useMemo } from 'react';
import './SearchableSelect.css';

/**
 * SearchableSelect
 * ----------------
 * A reusable dropdown component with a built-in search/filter input.
 * Used anywhere you need a select box that lets the user type to filter options.
 *
 * Props:
 *   options     - Array of objects to display as dropdown options
 *   value       - The currently selected option's value (uses valueKey to match)
 *   onChange    - Callback fired with the selected option's value when user picks one
 *   placeholder - Grey hint text shown when nothing is selected
 *   displayKey  - The key on each option object to show as the label  (e.g. "name")
 *   valueKey    - The key on each option object to use as the value   (e.g. "id")
 *   disabled    - If true, the dropdown cannot be opened and looks greyed out
 */
function SearchableSelect({ options, value, onChange, placeholder, displayKey, valueKey, disabled }) {
  // What the user has typed into the search box
  const [query, setQuery] = useState('');
  // Whether the dropdown list is currently visible
  const [open, setOpen] = useState(false);
  // Ref attached to the outer wrapper so we can detect clicks outside
  const ref = useRef(null);

  // Find the full option object that matches the current value so we can show its label
  const selected = options.find(o => String(o[valueKey]) === String(value));

  // Close the dropdown when the user clicks anywhere outside this component
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Only show options whose display label contains the search query (case-insensitive)
  const filtered = useMemo(() =>
    options.filter(o => o[displayKey].toLowerCase().includes(query.toLowerCase())),
    [options, query, displayKey]
  );

  // When the user picks an option: fire onChange, clear the search, and close the dropdown
  const handleSelect = (option) => {
    onChange(option[valueKey]);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="searchable-select" ref={ref}>

      {/* The visible "box" — shows the selected label or a search input when open */}
      <div
        className={`searchable-select-input${disabled ? ' searchable-select-disabled' : ''}`}
        onClick={() => { if (!disabled) setOpen(true); }}
      >
        {/* When closed and something is selected, show just the label text */}
        {!open && selected ? (
          <span className="searchable-select-value">{selected[displayKey]}</span>
        ) : (
          /* When open, replace the label with a live search input */
          <input
            autoFocus={open}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            placeholder={selected ? selected[displayKey] : placeholder}
            className="searchable-select-text"
            disabled={disabled}
            readOnly={disabled}
          />
        )}
        {/* Small down-arrow indicator on the right */}
        <span className="searchable-select-arrow">▾</span>
      </div>

      {/* The dropdown list — only rendered when open */}
      {open && (
        <ul className="searchable-select-dropdown">
          {filtered.length === 0 ? (
            <li className="searchable-select-no-results">No results found</li>
          ) : (
            filtered.map(option => (
              <li
                key={option[valueKey]}
                // Highlight the currently selected option
                className={`searchable-select-option ${String(option[valueKey]) === String(value) ? 'selected' : ''}`}
                onMouseDown={() => handleSelect(option)}
              >
                {option[displayKey]}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default SearchableSelect;
