import { useEffect } from 'react';
import AppRouter from './Router';
import { useAuthStore } from './stores/authStore';
import { useConfigStore } from './stores/configStore';

function App() {
  const init = useAuthStore((s) => s.init);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loadConfig = useConfigStore((s) => s.loadConfig);
  const configLoaded = useConfigStore((s) => s.loaded);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!isAuthenticated || configLoaded) return;
    loadConfig();
  }, [isAuthenticated, configLoaded, loadConfig]);

  return (
    <div className="App min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans">
      <AppRouter />
    </div>
  );
}

export default App;
