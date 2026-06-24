import { useEffect } from 'react';
import AppRouter from './Router';
import { useAuthStore } from './stores/authStore';
import { authService } from './services/auth';

function App() {
  const { init, setAuth, setUser, logout, isAuthenticated } = useAuthStore();

  useEffect(() => {
    init();

    if (isAuthenticated) {
      authService.getUser()
        .then((user) => setUser(user))
        .catch(() => logout());
    }
  }, []);

  return (
    <div className="App min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans">
      <AppRouter />
    </div>
  );
}

export default App;
