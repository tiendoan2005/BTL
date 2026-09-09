// Context xác thực: user + permissions, đăng xuất.
import { createContext, useContext, useMemo, useState } from 'react';
import { clearAuth, getStoredUser, isAuthenticated, saveAuth } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (isAuthenticated() ? getStoredUser() : null));

  const value = useMemo(() => ({
    user,
    isLoggedIn: Boolean(user),
    hasPermission: (required) => {
      if (!required?.length) return true;
      return user?.permissions?.some((p) => required.includes(p)) ?? false;
    },
    login: (authData) => {
      saveAuth(authData);
      setUser(authData.user);
    },
    logout: () => {
      clearAuth();
      setUser(null);
    },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
