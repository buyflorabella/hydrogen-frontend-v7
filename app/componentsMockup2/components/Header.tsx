import { Menu, Search, User, ShoppingCart, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useCart } from '../contexts/CartContext';
import SearchDropdown from './SearchDropdown';

import { useRouteLoaderData } from 'react-router';
import type { RootLoader } from '~/routes/root';

export const HeaderDebug = () => {
  useEffect(() => {
    // 1️⃣ Log all Vite / Hydrogen environment variables
    console.group('🛠️ IMPORT.META.ENV VARIABLES');
    console.table(import.meta.env);
    console.groupEnd();

    // 2️⃣ Log Node environment variables (if available in Hydrogen SSR)
    if (typeof process !== 'undefined' && process.env) {
      console.group('🟢 PROCESS.ENV VARIABLES');
      console.table(process.env);
      console.groupEnd();
    } else {
      console.log('process.env not available in browser runtime.');
    }

    // 3️⃣ Log Shopify globals on window
    if (typeof window !== 'undefined') {
      const windowGlobals: Record<string, any> = {};
      ['Shopify', 'ShopifyAnalytics', 'ShopifyCheckout', 'ShopifyPay', 'Shopify.theme'].forEach(key => {
        if ((window as any)[key]) {
          windowGlobals[key] = (window as any)[key];
        }
      });

      if (Object.keys(windowGlobals).length > 0) {
        console.group('🏷️ SHOPIFY WINDOW VARIABLES');
        console.table(windowGlobals);
        console.groupEnd();
      } else {
        console.log('No Shopify window globals found.');
      }

      // Log window.ENV if it exists
      if ((window as any).ENV) {
        console.group('🌐 WINDOW.ENV VARIABLES');
        console.table((window as any).ENV);
        console.groupEnd();
      } else {
        console.log('window.ENV not found.');
      }      
    }

    // 4️⃣ Log meta tags that Shopify often injects
    console.group('🔖 DOCUMENT META TAGS');
    Array.from(document.getElementsByTagName('meta')).forEach(meta => {
      console.log(meta.getAttribute('name') || meta.getAttribute('property'), meta.getAttribute('content'));
    });
    console.groupEnd();

    // 5️⃣ Log body data attributes, sometimes Shopify uses these for theme/shop info
    console.group('📝 BODY DATA ATTRIBUTES');
    Array.from(document.body.attributes).forEach(attr => {
      if (attr.name.startsWith('data-')) {
        console.log(attr.name, attr.value);
      }
    });
    console.groupEnd();

    // 6️⃣ Log dynamic contact page URL
    const DEFAULT_CONTACT_PAGE_URL = '/contact';
    const CONTACT_PAGE_URL =
      import.meta.env.PUBLIC_CONTACT_PAGE_URL ??
      import.meta.env.VITE_CONTACT_PAGE_URL ??
      DEFAULT_CONTACT_PAGE_URL;
    console.group('📌 CONTACT_PAGE_URL');
    console.log(CONTACT_PAGE_URL);
    console.groupEnd();

    // 7️⃣ Log Shopify sections / divs (often includes data-shop or data-section)
    console.group('🏗️ SHOPIFY SECTION DATA ATTRIBUTES');
    const sections = document.querySelectorAll('[id^="shopify-section-"]');
    sections.forEach((sec, idx) => {
      console.log(`Section ${idx}:`, sec.id, sec.dataset);
    });
    console.groupEnd();
  }, []);

  return null; // purely logging
};


export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { itemCount, openCart } = useCart();

  // 1. Get the data from the root loader
  const rootData = useRouteLoaderData<RootLoader>('root');

  console.log('SERVER rootData (from loader):', rootData);

   // 2. Safely extract variables with defaults
  // Explicitly check for the string "true"
  // This ensures that "false" (string) doesn't trigger the locked state.
  const storeLocked = rootData?.env?.storeLocked === "true";
  const message1 = rootData?.env?.message1 ?? '';
  const message2 = rootData?.env?.message2 ?? '';
  const message3 = rootData?.env?.message3 ?? '';  
  const contactPageUrl = rootData?.env?.contactPageUrl ?? '/contact';
  const shopPageUrl = rootData?.env?.shopPageUrl ?? '/shop'; // fallback if you have a shop page
  // helper: detect absolute URLs
  const isExternalUrl = (url: string): boolean => /^https?:\/\//i.test(url);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    if (!searchOpen) {
      setSearchQuery('');
    }
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
  };

  // 3. Conditional Return for Locked State
  if (storeLocked) {
    return (
      <header className="locked-header p-4 text-center bg-gray-100 border-b">
        <p className="font-bold">{message1}</p>
        <p className="text-sm">{message2}</p>
        <p className="text-xs italic">{message3}</p>
      </header>
    );
  }  


  return (
    <>
      <header
        className={`fixed top-8 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled ? 'top-0 glass-strong shadow-xl' : ''
        }`}
        style={{
          background: scrolled
            ? 'rgba(10, 10, 10, 0.85)'
            : 'rgba(10, 10, 10, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* <HeaderDebug debugEnv={debugEnv} />  logs environment variables */}          
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-all duration-300 hover:scale-110"
              >
                <Menu className="w-6 h-6 text-[#7cb342]" strokeWidth={2} />
              </button>
              <button
                onClick={toggleSearch}
                className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300 hover:scale-110 hover:rotate-12"
              >
                <Search className="w-6 h-6 text-[#7cb342]" strokeWidth={2} />
              </button>
            </div>

            <Link to="/" className="absolute left-1/2 transform -translate-x-1/2">
              <img
                src="/flora_bella_logo.png"
                alt="Flora Bella Trace Minerals"
                className={`transition-all duration-300 hover:scale-110 cursor-pointer ${scrolled ? 'h-16' : 'h-24'}`}
              />
            </Link>

            <div className="flex items-center gap-6">
              <span>DxB v7.2</span>
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-white">
                {isExternalUrl(shopPageUrl) ? (
                  <a
                    href={shopPageUrl}
                    rel="noopener noreferrer"
                    className="text-white hover:text-[#7cb342] transition-all duration-300 hover:scale-110 hover:-translate-y-1 no-underline"
                  >
                    Shop
                  </a>
                ) : (
                  <Link
                    to={shopPageUrl}
                    className="text-white hover:text-[#7cb342] transition-all duration-300 hover:scale-110 hover:-translate-y-1 no-underline"
                  >
                    Shop
                  </Link>
                )}
                <Link
                  to="/learn"
                  className="text-white hover:text-[#7cb342] transition-all duration-300 hover:scale-110 hover:-translate-y-1 no-underline"
                >
                  Learn
                </Link>
                <Link
                  to="/about"
                  className="text-white hover:text-[#7cb342] transition-all duration-300 hover:scale-110 hover:-translate-y-1 no-underline"
                >
                  About
                </Link>
                <Link
                  to="/community"
                  className="text-white hover:text-[#7cb342] transition-all duration-300 hover:scale-110 hover:-translate-y-1 no-underline"
                >
                  Community
                </Link>
                {/* EXTERNAL LINK — MUST use <a>, not <Link> */}
                {isExternalUrl(contactPageUrl) ? (
                  <a
                    href={contactPageUrl}
                    rel="noopener noreferrer"
                    className="text-white hover:text-[#7cb342] transition-all duration-300 hover:scale-110 hover:-translate-y-1 no-underline"
                  >
                    Contact
                  </a>
                ) : (
                  <Link
                    to={contactPageUrl}
                    className="text-white hover:text-[#7cb342] transition-all duration-300 hover:scale-110 hover:-translate-y-1 no-underline"
                  >
                    Contact
                  </Link>
                )}
              </nav>
              <Link to="/password" className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300 hover:scale-110 hover:rotate-12">
                <User className="w-5 h-5 text-white" strokeWidth={2} />
              </Link>              
              <Link to="/account" className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300 hover:scale-110 hover:rotate-12">
                <User className="w-5 h-5 text-white" strokeWidth={2} />
              </Link>
              <button
                onClick={openCart}
                className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300 hover:scale-110 group relative"
              >
                <ShoppingCart className="w-5 h-5 text-white group-hover:animate-bounce" strokeWidth={2} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#7cb342] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold group-hover:scale-125 transition-transform">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-white/10 bg-black/90 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products and articles..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#7cb342] transition-colors"
                  autoFocus
                />
                {searchQuery && <SearchDropdown searchQuery={searchQuery} onClose={closeSearch} />}
              </div>
            </div>
          </div>
        )}
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeMobileMenu}
          />
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-b from-[#0a0015] to-[#1a1a2e] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <img
                src="/flora_bella_logo.png"
                alt="Flora Bella"
                className="h-16"
              />
              <button
                onClick={closeMobileMenu}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <nav className="flex flex-col p-6 space-y-2">
              <Link
                to="/shop"
                onClick={closeMobileMenu}
                className="text-white text-lg font-medium py-4 px-4 hover:bg-white/10 rounded-lg transition-colors"
              >
                Shop
              </Link>
              <Link
                to="/learn"
                onClick={closeMobileMenu}
                className="text-white text-lg font-medium py-4 px-4 hover:bg-white/10 rounded-lg transition-colors"
              >
                Learn
              </Link>
              <Link
                to="/about"
                onClick={closeMobileMenu}
                className="text-white text-lg font-medium py-4 px-4 hover:bg-white/10 rounded-lg transition-colors"
              >
                About
              </Link>
              <Link
                to="/community"
                onClick={closeMobileMenu}
                className="text-white text-lg font-medium py-4 px-4 hover:bg-white/10 rounded-lg transition-colors"
              >
                Community
              </Link>
              <Link
                to="/contact"
                onClick={closeMobileMenu}
                className="text-white text-lg font-medium py-4 px-4 hover:bg-white/10 rounded-lg transition-colors"
              >
                Contact
              </Link>
              <Link
                to="/account"
                onClick={closeMobileMenu}
                className="text-white text-lg font-medium py-4 px-4 hover:bg-white/10 rounded-lg transition-colors"
              >
                Account
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
