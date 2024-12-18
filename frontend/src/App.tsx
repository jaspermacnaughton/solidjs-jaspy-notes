import { Show, type Component } from 'solid-js';
import { AuthContextProvider, useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import Notes from './components/Notes';

const AppContent: Component = () => {
  const auth = useAuth();

  return (
    <Show
      when={auth.isAuthenticated()}
      fallback={<Auth />}
    >
      <Notes />
    </Show>
  );
};

const App: Component = () => {
  return (
    <AuthContextProvider>
      <AppContent />
    </AuthContextProvider>
  );
};

export default App;