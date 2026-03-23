import { useContext } from 'react';
import { AuthContext } from './AuthContext';

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  return ctx;
};