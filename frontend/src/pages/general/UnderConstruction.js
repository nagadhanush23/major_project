// client/src/pages/UnderConstruction.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../dashboard/Home.css';

const UnderConstruction = () => {
  return (
    <div className="status-page">
      <div className="status-card">
        <p className="eyebrow">Status</p>
        <h1>Application under development</h1>
        <p className="subtitle">
          We are crafting the next part of FinFlow. You can close this tab or head back to the home page to keep exploring.
        </p>
        <div className="status-actions">
          <Link className="btn primary" to="/">
            Return home
          </Link>
          <button className="btn ghost" onClick={() => window.close()}>
            Close tab
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnderConstruction;

