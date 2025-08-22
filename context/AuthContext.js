// context/AuthContext.js
import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

const initialState = {
  isAuthed: false,
  user: null,
  token: null,
  bootstrapped: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'BOOTSTRAP': {
      const { token, user } = action.payload || {};
      return {
        ...state,
        isAuthed: !!token,
        token: token || null,
        user: user || null,
        bootstrapped: true,
      };
    }
    case 'LOGIN':
      return {
        ...state,
        isAuthed: true,
        token: action.payload.token || 'dev-token',
        user: action.payload.user || null,
      };
    case 'LOGOUT':
      return { ...initialState, bootstrapped: true };
    case 'SET_USER':
      return { ...state, user: action.payload || null };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load saved session once
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('auth.token');
        const userStr = await AsyncStorage.getItem('auth.user');
        const user = userStr ? JSON.parse(userStr) : null;
        dispatch({ type: 'BOOTSTRAP', payload: { token, user } });
      } catch {
        dispatch({ type: 'BOOTSTRAP', payload: {} });
      }
    })();
  }, []);

  // TEMP login: accept any credentials and persist a token
  const login = async (username, _password) => {
    const user = { name: username || 'User' };
    await AsyncStorage.setItem('auth.token', 'dev-token');
    await AsyncStorage.setItem('auth.user', JSON.stringify(user));
    dispatch({ type: 'LOGIN', payload: { token: 'dev-token', user } });
    return true;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['auth.token', 'auth.user']);
    dispatch({ type: 'LOGOUT' });
  };

  const value = useMemo(
    () => ({ ...state, login, logout, setUser: (u) => dispatch({ type: 'SET_USER', payload: u }) }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}