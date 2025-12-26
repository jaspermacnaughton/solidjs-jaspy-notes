import { Show, type Component } from 'solid-js';
import { Router, Route, Navigate } from '@solidjs/router';

import { AuthContextProvider, useAuth } from './context/AuthContext';
import { ToastContextProvider } from './context/ToastContext';
import Auth from './pages/Auth';
import Notes from './pages/Notes/Notes';

const ProtectedRoute: Component<{ children: any }> = (props) => {
  const auth = useAuth();
  return auth.isAuthenticated() ? props.children : <Navigate href="/login" />;
};

const AppContent: Component = () => {
  const auth = useAuth();

  return (
    <Show when={!auth.isLoading()} fallback={<div>Loading...</div>}>
      <Router>
        <Route 
          path="/" 
          component={() => (
            <ProtectedRoute>
              <Notes />
            </ProtectedRoute>
          )} 
        />
        <Route path="/login" component={Auth} />
      </Router>
    </Show>
  );
};

const App: Component = () => {
  return (
    <ToastContextProvider>
      <AuthContextProvider>
        <AppContent />
      </AuthContextProvider>
    </ToastContextProvider>
  );
};

export default App;