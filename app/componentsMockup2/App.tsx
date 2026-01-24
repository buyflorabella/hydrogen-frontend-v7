// import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { type FC, type ReactNode } from 'react';
import { CartProvider } from './contexts/CartContext';
import { FeatureFlagsProvider } from './contexts/FeatureFlagsContext';
import { SavedItemsProvider } from './contexts/SavedItemsContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { EnvProvider, type EnvValues } from "./contexts/EnvContext";
import Header, { loader as headerLoader } from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import SurveyPopup from './components/SurveyPopup';
import WhatsAppWidget from './components/WhatsAppWidget';
import TestingWidget from './components/TestingWidget';
import AbandonedCartPopup from './components/AbandonedCartPopup';
import DiscountBanner from './components/DiscountBanner';
// import ShopPage from './pages/ShopPage';
// import ProductDetailPage from './pages/ProductDetailPage';
// import LearnPage from './pages/LearnPage';
// import ArticlePage from './pages/ArticlePage';
// import FAQPage from './pages/FAQPage';
// import ContactPage from './pages/ContactPage';
// import LoginPage from './pages/LoginPage';
// import RegisterPage from './pages/RegisterPage';
// import ForgotPasswordPage from './pages/ForgotPasswordPage';
// import AccountPage from './pages/AccountPage';
// import CheckoutPage from './pages/CheckoutPage';
// import OrderConfirmationPage from './pages/OrderConfirmationPage';
// import PolicyPage from './pages/PolicyPage';
// import TechnicalDocsPage from './pages/TechnicalDocsPage';

function getEnvValues(context?: any): EnvValues {
  // context?.env = Hydrogen server-side env
  // import.meta.env = client-side env (Vite)
  const env = context?.env ?? import.meta.env;

  return {
    storeLocked: (env.VITE_PUBLIC_STORE_LOCKED ?? env.PUBLIC_STORE_LOCKED ?? "false") === "true",
    message1: env.VITE_PUBLIC_STORE_MESSAGE1 ?? env.PUBLIC_STORE_MESSAGE1 ?? "",
    message2: env.VITE_PUBLIC_STORE_MESSAGE2 ?? env.PUBLIC_STORE_MESSAGE2 ?? "",
    message3: env.VITE_PUBLIC_STORE_MESSAGE3 ?? env.PUBLIC_STORE_MESSAGE3 ?? "",
  };
}

const App: FC<{ children: ReactNode }> = ({children}) => {
  // DxB import the environment into our context
  const envValues: EnvValues = getEnvValues();

  // 'import.meta.env' is only available anyway in dev mode
  if (import.meta.env.DEV)  console.log("DxB - - - -- -- -- -- --- --- --- --- ---- ---- ---- App.tsx ---- ---- const App:");
  return (
    <EnvProvider env={envValues}>    
      <FeatureFlagsProvider>
        <SavedItemsProvider>
          <WishlistProvider>
            <CartProvider>
              <div className="min-h-screen bg-[#0a0015]">
                <DiscountBanner
                  message="Get 15% off your first order!"
                  code="WELCOME15"
                  percentage={15}
                />
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
    </EnvProvider>
  );
}

export default App;
