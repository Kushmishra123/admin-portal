import React, { createContext, useContext, useState, useCallback } from 'react';

const LoaderContext = createContext();

export const useLoader = () => useContext(LoaderContext);

export const LoaderProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Wraps any async action with the global loading state.
   * Usage in any component:
   *   const { withLoader } = useLoader();
   *   withLoader(() => fetch(...))
   */
  const withLoader = useCallback(async (asyncFn) => {
    setIsLoading(true);
    try {
      return await asyncFn();
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <LoaderContext.Provider value={{ isLoading, setIsLoading, withLoader }}>
      {children}
    </LoaderContext.Provider>
  );
};
