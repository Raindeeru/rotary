import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const token = localStorage.getItem('rotary_access_token');

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname || '/admin' }}
      />
    );
  }

  return children;
}

