import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../api';

function RequireAuth({ children }) {
  const location = useLocation();

  if (!auth.isAuthenticated()) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default RequireAuth;
