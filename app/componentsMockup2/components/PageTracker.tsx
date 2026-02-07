import {useAnalytics} from '@shopify/hydrogen';
import { useEffect } from 'react';
import { useLocation } from 'react-router';

export default function PageTracker() {
  const location = useLocation();
  const {subscribe} = useAnalytics();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'G-MYFE3JJT6S', {
        page_path: location.pathname,
      });
    }

    // Subscribe to the 'page_viewed' event from Hydrogen
    subscribe('page_viewed', (data) => {
      window.gtag('event', 'page_view', {
        page_path: data.url,
        page_title: document.title,
      });
    });

    // Optional: Track 'product_viewed'
    subscribe('product_viewed', (data) => {
      window.gtag('event', 'view_item', {
        ecommerce: {
          items: data.products.map(p => ({
            item_id: p.id,
            item_name: p.title,
            price: p.price
          }))
        }
      });
    });

  }, [location, subscribe]);

  return null;
}
