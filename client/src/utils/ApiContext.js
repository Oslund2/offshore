import React, { createContext, useContext } from 'react';
import { api as supabaseApi } from './api';

const ApiContext = createContext(supabaseApi);

export function ApiProvider({ api, children }) {
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

export function useApi() {
  return useContext(ApiContext);
}
