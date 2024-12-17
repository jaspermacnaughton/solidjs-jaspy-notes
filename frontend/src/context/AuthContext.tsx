import { createContext, JSXElement, useContext, createSignal } from "solid-js";

export type AuthContextType = {
  isAuthenticated: () => boolean;
  userId: () => number | null;
  username: () => string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>();

type AuthProviderProps = {
  children?: JSXElement;
}

export function AuthContextProvider(props: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = createSignal(false);
  const [userId, setUserId] = createSignal<number | null>(null);
  const [username, setUsername] = createSignal<string | null>(null);

  const login = async (username: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');
    
    console.log("Successfully logged in");

    setIsAuthenticated(true);
    setUserId(data.user_id);
    setUsername(username);
  };

  const register = async (username: string, password: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Registration failed');

    setIsAuthenticated(true);
    setUserId(data.user_id);
    setUsername(username);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserId(null);
    setUsername(null);
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