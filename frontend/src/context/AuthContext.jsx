import { createContext, useState, useEffect, useContext } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// The session lives in an httpOnly cookie the browser manages — JS never sees the token.
// Auth state is derived by asking the backend "who am I" rather than reading local storage.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // _skipAuthRedirect: this is a passive "am I logged in?" probe for anonymous
        // visitors too — a 401 here must not force-redirect them away from a public page.
        const res = await api.get('/auth/me', { _skipAuthRedirect: true });
        setUser(res.data);
      } catch {
        setUser(null);
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    setUser(res.data);
    return res.data;
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch {
      // silent — 401 handled by axios interceptor
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
