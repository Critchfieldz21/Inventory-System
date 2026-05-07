import React, { useState, useCallback } from 'react';

function RecoveryCodeModal({ heading, code, onAcknowledge }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [copyState, setCopyState] = useState('idle'); // 'idle' | 'copied' | 'error'

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch (_) {
      setCopyState('error');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  }, [code]);

  return (
    <div className="recovery-overlay" role="dialog" aria-modal="true" aria-labelledby="recovery-heading">
      <div className="recovery-modal">
        <h3 id="recovery-heading">{heading}</h3>
        <p className="recovery-explainer">
          This is the only way to reset your password if you forget it.
          Save it somewhere safe — we won&apos;t show it again.
        </p>

        <div className="recovery-code-box">
          <code>{code}</code>
          <button
            type="button"
            className="recovery-copy-btn"
            onClick={handleCopy}
          >
            {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Failed' : 'Copy'}
          </button>
        </div>

        <label className="recovery-confirm">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
          />
          <span>I have saved my recovery code in a safe place.</span>
        </label>

        <button
          type="button"
          className="login-button"
          disabled={!acknowledged}
          onClick={onAcknowledge}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default RecoveryCodeModal;
