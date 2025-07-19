import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { LoginButton } from '../components/LoginButton';

export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/friends', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="login-page">
        <div className="loading-container">
          <div className="loading-spinner">🔄</div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>🎮 Steam Wishlist Review</h1>
          <p>Compare Steam game prices across different regions</p>
        </div>
        
        <div className="login-content">
          <div className="login-info">
            <h2>Welcome!</h2>
            <p>
              Sign in with your Steam account to view your friends' wishlists 
              and compare game prices across different regions.
            </p>
            <ul className="features-list">
              <li>✅ View your Steam friends alphabetically</li>
              <li>✅ Compare game prices across regions</li>
              <li>✅ Instant loading with smart caching</li>
              <li>✅ Real-time price updates</li>
            </ul>
          </div>
          
          <div className="login-action">
            <LoginButton />
          </div>
        </div>
        
        <div className="login-footer">
          <p>
            Built with React + Bun for maximum performance. 
            Your Steam data is handled securely and never stored permanently.
          </p>
        </div>
      </div>
    </div>
  );
}