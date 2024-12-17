import { Show, type Component } from 'solid-js';
import { AuthContextProvider, useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import Notes from './components/Notes';

const AppContent: Component = () => {
  const auth = useAuth();
  
  console.log("Auth state:", auth.isAuthenticated(), auth.username());

  return (
    <Show
      when={auth.isAuthenticated()}
      fallback={<Auth />}
    >
      <header class="my-4 p-2 flex items-center justify-between">
        <h1 class="text-2xl">Jaspy Notes</h1>
        <div class="flex items-center gap-4">
          <span>Welcome, {auth.username()}</span>
          <button 
            onClick={() => auth.logout()}
            class="btn"
          >
            Logout
          </button>
        </div>
      </header>
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