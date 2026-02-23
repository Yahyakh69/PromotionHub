import { User } from '../types';

const SESSION_KEY = 'dji_session';

export const authService = {
  // Login now just sets the session, validation happens in Login component via DB query
  setSession: (user: any) => {
    // Create session object
    const sessionUser: User = {
      id: user._id || user.id, // Handle both Convex ID and potential local ID
      name: user.name,
      email: user.email,
      role: user.role,
      partnerId: user.partnerId
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.reload();
  },

  getCurrentUser: (): User | null => {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(SESSION_KEY);
  }
};