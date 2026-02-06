import {useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router';
import {useAside} from '~/componentsMockup2/contexts/AsideContext';

/**
 * Handles cart_return query param from checkout return flow.
 * Opens the cart tray automatically when user returns from checkout.
 */
export function CartReturnHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const {openAside} = useAside();

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (params.get('cart_return') === 'true') {
      // Open cart tray
      openAside('cart');

      // Clean up URL by removing the cart_return param
      params.delete('cart_return');
      const newSearch = params.toString();
      const newUrl = location.pathname + (newSearch ? `?${newSearch}` : '');

      // Replace URL without cart_return param (no history entry)
      navigate(newUrl, {replace: true});
    }
  }, [location.search, location.pathname, navigate, openAside]);

  return null;
}
