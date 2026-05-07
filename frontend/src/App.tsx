import { Provider } from 'react-redux';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { store } from './app/store';
import AppRouter from './router/AppRouter';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Capture Google OAuth token from redirect before React Router runs
(() => {
  if (window.location.hash.includes('access_token=')) {
    const p = new URLSearchParams(window.location.hash.substring(1));
    const t = p.get('access_token');
    if (t) {
      sessionStorage.setItem('_gtoken', t);
      window.history.replaceState(null, '', '/login');
    }
  }
})();

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Provider store={store}>
        <AppRouter />
      </Provider>
    </GoogleOAuthProvider>
  );
}

export default App;
