import { useEffect } from 'react';
import { useLocation } from 'react-router';

export default function ClarityTracker() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('set', 'page', location.pathname);
    }
  }, [location]);

  return null;
}
