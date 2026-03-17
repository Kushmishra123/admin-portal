import { createContext, useContext } from 'react';

export const UserContext = createContext(null);

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be inside UserContext.Provider');
  return ctx;
};
