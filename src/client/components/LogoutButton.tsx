import React from 'react';
import type { AuthenticatedUser } from '../../server/auth';

interface LogoutButtonProps {
  user: AuthenticatedUser;
  onLogout: () => void;
}

export function LogoutButton({ user, onLogout }: LogoutButtonProps) {
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout');
      onLogout();
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if the API call fails, we should still clear the local state
      onLogout();
    }
  };

  return (
    <div className="user-info">
      <div className="user-profile">
        <img 
          src={user.avatar} 
          alt={user.personaname}
          className="user-avatar"
        />
        <span className="user-name">{user.personaname}</span>
      </div>
      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
}