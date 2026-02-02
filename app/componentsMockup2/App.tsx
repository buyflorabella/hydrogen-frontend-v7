import { type FC, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { FeatureFlagsProvider } from './contexts/FeatureFlagsContext';
import { SavedItemsProvider } from './contexts/SavedItemsContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { EnvProvider, type EnvValues } from "./contexts/EnvContext";
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import SurveyPopup from './components/SurveyPopup';
import WhatsAppWidget from './components/WhatsAppWidget';
import TestingWidget from './components/TestingWidget';
import AbandonedCartPopup from './components/AbandonedCartPopup';
import DiscountBanner from './components/DiscountBanner';
import SoloShopButton from '../componentsMockup2/components/SoloShopButton';

import { useRouteLoaderData } from 'react-router';
export type RootLoader = typeof loader;

const App: FC<{ children: ReactNode }> = ({children}) => {
  const location = useLocation();

  // Don't show on certain pages
  const showSoloShopButton = ['/', '/learn', '/contact', '/returns'].includes(location.pathname);

  return (
      <FeatureFlagsProvider>
        <SavedItemsProvider>
          <WishlistProvider>
            <CartProvider>
              <div className="min-h-screen bg-[#0a0015]">
                <Header />
                <main>
                  {children}
                  {/* <Routes>
                    <Route path="/privacy" element={<PolicyPage />} />
                    <Route path="/terms" element={<PolicyPage />} />
                    <Route path="/shipping" element={<PolicyPage />} />
                    <Route path="/returns" element={<PolicyPage />} />
                    <Route path="/technical-docs" element={<TechnicalDocsPage />} />
                  </Routes> */}
                </main>
                {showSoloShopButton && <SoloShopButton />}
                <Footer />
                <CartDrawer />
                <SurveyPopup />
                <WhatsAppWidget />
                <AbandonedCartPopup />
                <TestingWidget />
              </div>
            </CartProvider>
          </WishlistProvider>
        </SavedItemsProvider>
      </FeatureFlagsProvider>
  );
}

export default App;
