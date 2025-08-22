// context/AuthContext.js
import React, { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [user, setUser] = useState(null);

  // TEMP login: accept anything and set a demo user
  const login = async (identifier, _password) => {
    setIsAuthed(true);
    const name = identifier?.trim() ? identifier.trim() : 'Guest User';
    setUser({ id: 'demo', name, email: `${name.toLowerCase().replace(/\s+/g, '')}@demo.local` });
  };

  const logout = () => {
    setIsAuthed(false);
    setUser(null);
  };

  const value = useMemo(() => ({ isAuthed, user, login, logout }), [isAuthed, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
