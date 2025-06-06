import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface UserData {
  userId: string;
  userRole: 'admin' | 'user';
  previousSearches: string[];
}

export function useUserData() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize user data immediately
    const initializeUserData = () => {
      const userId = Cookies.get('userId');
      const userRole = Cookies.get('userRole') as 'admin' | 'user';
      
      if (userId && userRole) {
        // Get previous searches from localStorage
        const previousSearches = JSON.parse(localStorage.getItem(`searches_${userId}`) || '[]');
        
        setUserData({
          userId,
          userRole,
          previousSearches
        });
      }
      setIsLoading(false);
    };

    // Call initialization immediately
    initializeUserData();

    // Set up a listener for cookie changes
    const checkInterval = setInterval(() => {
      const currentUserId = Cookies.get('userId');
      const currentUserRole = Cookies.get('userRole');
      
      if (currentUserId !== userData?.userId || currentUserRole !== userData?.userRole) {
        initializeUserData();
      }
    }, 1000); // Check every second

    return () => clearInterval(checkInterval);
  }, [userData?.userId, userData?.userRole]);

  const addSearch = (search: string) => {
    if (!userData) return;

    const updatedSearches = [...userData.previousSearches, search].slice(-10); // Keep last 10 searches
    localStorage.setItem(`searches_${userData.userId}`, JSON.stringify(updatedSearches));
    
    setUserData(prev => prev ? {
      ...prev,
      previousSearches: updatedSearches
    } : null);
  };

  const clearSearches = () => {
    if (!userData) return;

    localStorage.removeItem(`searches_${userData.userId}`);
    setUserData(prev => prev ? {
      ...prev,
      previousSearches: []
    } : null);
  };

  const isAdmin = userData?.userRole === 'admin';

  return {
    userData,
    isLoading,
    addSearch,
    clearSearches,
    isAdmin
  };
} 