import React, { useState, useEffect, useRef, useMemo } from 'react';

/**
 * SalesSearchableSelect
 * ---------------------
 * A searchable dropdown used throughout the Sales page.
 *
 * Props:
 *   options     - Array of objects to display
 *   value       - Currently selected value (matched against valueKey)
 *   onChange    - Callback(selectedValue) when an option is picked
 *   placeholder - Placeholder text shown when nothing is selected
 *   displayKey  - Which key on each option to show as the label
 *   valueKey    - Which key on each option to use as the value
 *   subKey      - Optional: if provided, appends "(Stock: N)" to each label
 */
function SalesSearchableSelect({ options, value, onChange, placeholder, displayKey, valueKey, subKey }) {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const ref = useRef(null);

  // The currently selected option object
  const selected = options.find(o => String(o[valueKey]) === String(value));

  // Close dropdown when clicking outside the component
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filter options by the typed query — memoized to avoid re-filtering on every render
  const filtered = useMemo(() =>
    options.filter(o => o[displayKey].toLowerCase().includes(query.toLowerCase())),
    [options, query, displayKey]
  );

  const handleSelect = (option) => {
    onChange(option[valueKey]);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="searchable-select" ref={ref}>
      <div className="searchable-select-input" onClick={() => setOpen(true)}>
        {!open && selected ? (
          // Show the selected label when dropdown is closed
          <span className="searchable-select-value">
            {selected[displayKey]}{subKey ? ` (Stock: ${selected[subKey]})` : ''}
          </span>
        ) : (
          // Show a text input when the dropdown is open
          <input
            autoFocus={open}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            placeholder={selected ? selected[displayKey] : placeholder}
            className="searchable-select-text"
          />
        )}
        <span className="searchable-select-arrow">▾</span>
      </div>

      {open && (
        <ul className="searchable-select-dropdown">
          {filtered.length === 0 ? (
            <li className="searchable-select-no-results">No results found</li>
          ) : (
            filtered.map(option => (
              <li
                key={option[valueKey]}
                className={`searchable-select-option ${String(option[valueKey]) === String(value) ? 'selected' : ''}`}
                onMouseDown={() => handleSelect(option)}
              >
                {option[displayKey]}{subKey ? ` (Stock: ${option[subKey]})` : ''}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default SalesSearchableSelect;
