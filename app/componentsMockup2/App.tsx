// import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { type FC, type ReactNode } from 'react';
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

import { useRouteLoaderData } from 'react-router';
export type RootLoader = typeof loader;



/*
Deprecate - retest variable deploy if we take this ouT!!!


// 1. The Loader (Runs on Server)
export async function loader({context}: Route.LoaderArgs) {
  const { storefront, env } = args.context;

  // Fetching data logic (placeholders for your existing functions)
  const deferredData = {}; // loadDeferredData(args);
  const criticalData = {}; // await loadCriticalData(args);

  const loaderPayload = {
    ...deferredData,
    ...criticalData,
    // We pass the RAW env object here. 
    // The EnvProvider we built earlier will handle the "true" string conversion.
    env: {
      PUBLIC_STORE_LOCKED: env.PUBLIC_STORE_LOCKED,
      PUBLIC_STORE_MESSAGE1: env.PUBLIC_STORE_MESSAGE1 || "",
      PUBLIC_STORE_MESSAGE2: env.PUBLIC_STORE_MESSAGE2 || "",
      PUBLIC_STORE_MESSAGE3: env.PUBLIC_STORE_MESSAGE3 || "",
      PUBLIC_STORE_DOMAIN: env.PUBLIC_STORE_DOMAIN,
      PUBLIC_STOREFRONT_ID: env.PUBLIC_STOREFRONT_ID,
      PUBLIC_CHECKOUT_DOMAIN: env.PUBLIC_CHECKOUT_DOMAIN,
      PUBLIC_STOREFRONT_API_TOKEN: env.PUBLIC_STOREFRONT_API_TOKEN,
    },
  };


  // This log only appears in the Shopify Oxygen Logs or your terminal
  console.log("FINAL LOADER PAYLOAD:", JSON.stringify(loaderPayload, null, 2));

  return loaderPayload;
}

*/



const App: FC<{ children: ReactNode }> = ({children}) => {
  // DxB import the environment into our context
  const data = useRouteLoaderData<RootLoader>('root');

  // 'import.meta.env' is only available anyway in dev mode
  //if (import.meta.env.DEV)  console.log("DxB [v1] - - - -- -- -- -- --- --- --- --- ---- ---- ---- App.tsx ---- ---- const App:");
  console.log("DxB [v1] - - - -- -- -- -- --- --- --- --- ---- ---- ---- App.tsx ---- ---- const App:");
  return (
    <EnvProvider env={data?.env}>    
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
