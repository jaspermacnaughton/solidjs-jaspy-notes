import { createContext, JSXElement, useContext, createSignal, onMount } from "solid-js";

export type AuthContextType = {
  isAuthenticated: () => boolean;
  userId: () => number | null;
  username: () => string | null;
  token: () => string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>();

export function AuthContextProvider(props: { children?: JSXElement }) {
  const [isAuthenticated, setIsAuthenticated] = createSignal(false);
  const [userId, setUserId] = createSignal<number | null>(null);
  const [username, setUsername] = createSignal<string | null>(null);
  const [token, setToken] = createSignal<string | null>(null);

  // Check for stored auth on mount
  onMount(() => {
    const stored = localStorage.getItem('authState');
    if (stored) {
      try {
        const state = JSON.parse(stored);
        // Verify all required fields are present
        if (state.userId && state.username && state.token) {
          setIsAuthenticated(true);
          setUserId(state.userId);
          setUsername(state.username);
          setToken(state.token);
        } else {
          // If missing required fields, clear the invalid stored state
          localStorage.removeItem('authState');
        }
      } catch (e) {
        // If JSON parsing fails, clear the invalid stored state
        localStorage.removeItem('authState');
      }
    }
  });

  const login = async (username: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');

    const authState = {
      userId: data.user_id,
      username,
      token: data.token
    };

    setUserId(data.user_id);
    setUsername(username);
    setToken(data.token);
    setIsAuthenticated(true);
    localStorage.setItem('authState', JSON.stringify(authState));
  };

  const register = async (username: string, password: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Registration failed');

    const authState = {
      userId: data.user_id,
      username,
      token: data.token
    };

    setIsAuthenticated(true);
    setUserId(data.user_id);
    setUsername(username);
    setToken(data.token);
    localStorage.setItem('authState', JSON.stringify(authState));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserId(null);
    setUsername(null);
    setToken(null);
    localStorage.removeItem('authState');
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      userId,
      username,
      token,
      login,
      register,
      logout
    }}>
      {props.children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthContextProvider");
  return context;
} 