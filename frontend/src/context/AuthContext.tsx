import { createContext, JSXElement, useContext, createSignal } from "solid-js";

export type AuthContextType = {
  isAuthenticated: () => boolean;
  userId: () => number | null;
  username: () => string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

type StoredAuthState = {
  isAuthenticated: boolean;
  userId: number | null;
  username: string | null;
}

export const AuthContext = createContext<AuthContextType>();

type AuthProviderProps = {
  children?: JSXElement;
}

export function AuthContextProvider(props: AuthProviderProps) {
  // Initialize from localStorage if available
  const loadStoredAuth = (): StoredAuthState => {
    const stored = localStorage.getItem('authState');
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      isAuthenticated: false,
      userId: null,
      username: null
    };
  };

  const [isAuthenticated, setIsAuthenticated] = createSignal(loadStoredAuth().isAuthenticated);
  const [userId, setUserId] = createSignal<number | null>(loadStoredAuth().userId);
  const [username, setUsername] = createSignal<string | null>(loadStoredAuth().username);

  // Helper to update both state and localStorage
  const updateAuthState = (state: StoredAuthState) => {
    setIsAuthenticated(state.isAuthenticated);
    setUserId(state.userId);
    setUsername(state.username);
    localStorage.setItem('authState', JSON.stringify(state));
  };

  const login = async (username: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');

    updateAuthState({
      isAuthenticated: true,
      userId: data.user_id,
      username: username
    });
  };

  const register = async (username: string, password: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Registration failed');

    updateAuthState({
      isAuthenticated: true,
      userId: data.user_id,
      username: username
    });
  };

  const logout = () => {
    updateAuthState({
      isAuthenticated: false,
      userId: null,
      username: null
    });
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      userId,
      username,
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
  if (!context) throw new Error("AuthContext must be used within AuthProvider");
  return context;
} 