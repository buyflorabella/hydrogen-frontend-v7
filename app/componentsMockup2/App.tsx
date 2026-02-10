import { type FC, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { CartProvider } from './contexts/CartContext';
import { FeatureFlagsProvider } from './contexts/FeatureFlagsContext';
import { SavedItemsProvider } from './contexts/SavedItemsContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { EnvProvider, type EnvValues } from "./contexts/EnvContext";
import { AsideProvider } from "./contexts/AsideContext";
import { ToastProvider } from "./contexts/ToastContext";
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import SurveyPopup from './components/SurveyPopup';
import WhatsAppWidget from './components/WhatsAppWidget';
import TestingWidget from './components/TestingWidget';
import AbandonedCartPopup from './components/AbandonedCartPopup';
import DiscountBanner from './components/DiscountBanner';
import SoloShopButton from './components/SoloShopButton';
import FloatingWidgetColumn from './components/FloatingWidgetColumn';
import {CartReturnHandler} from '~/components/CartReturnHandler';
import Mockup2Root from './App';
import PageTracker from './components/PageTracker';
import ClarityTracker from './components/ClarityTracker';
//import {Analytics, getShopAnalytics, useNonce} from '@shopify/hydrogen';

import { useRouteLoaderData } from 'react-router';
export type RootLoader = typeof loader;

const App: FC<{ children: ReactNode }> = ({children}) => {
  const location = useLocation();
  //const nonce = useNonce();
  // Don't show on certain pages
  const showSoloShopButton = ['/', '/learn', '/contact', '/returns'].includes(location.pathname);

  // DxB - debugging login/logout
  const data = useRouteLoaderData<RootLoader>('root');
  
  // CLIENT-SIDE AUTH DEBUG
  // useEffect(() => {
  //   console.log('[CLIENT AUTH DEBUG]', {
  //     userData: data?.userData,
  //     isLoggedIn: !!data?.userData,
  //   });
  // }, [data?.userData]);
  
  if (!data) return <Outlet />;

  return (
    <EnvProvider env={data?.env}>     
      <FeatureFlagsProvider envOverrides={data?.features}>
        <AsideProvider>
          <ToastProvider>
            <SavedItemsProvider>
              <WishlistProvider>
                  <CartProvider>
                    <div className="min-h-screen bg-[#0a0015]">
                      <Header />
                      <main>
                        <Mockup2Root>
                          <PageTracker />
                          <ClarityTracker />
                          {children ?? <Outlet />}
                        </Mockup2Root>
                      </main>
                      {showSoloShopButton && <SoloShopButton />}
                      <Footer />
                      <CartDrawer />
                      <CartReturnHandler />
                      <SurveyPopup />
                      <FloatingWidgetColumn />
                      <AbandonedCartPopup />
                    </div>
                  </CartProvider>
              </WishlistProvider>
            </SavedItemsProvider>
          </ToastProvider>
        </AsideProvider>
      </FeatureFlagsProvider>
    </EnvProvider>
  );
}

export default App;
