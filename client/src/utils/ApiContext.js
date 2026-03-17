import React, { createContext, useContext } from 'react';

// Default to null — any component outside ApiProvider will get null,
// making misconfiguration immediately obvious instead of silently using supabase
const ApiContext = createContext(null);

export function ApiProvider({ api, children }) {
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

export function useApi() {
  const api = useContext(ApiContext);
  if (!api) throw new Error('useApi() called outside of <ApiProvider>');
  return api;
}
