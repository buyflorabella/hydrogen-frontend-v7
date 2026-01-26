import {Analytics, getShopAnalytics, useNonce} from '@shopify/hydrogen';
import {
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  type ShouldRevalidateFunction,
  Links,
  Meta,
  Scripts,
  // ScrollRestoration,
  useRouteLoaderData,
} from 'react-router';
import type {Route} from './+types/root';
import favicon from '~/assets/favicon.svg';
import {FOOTER_QUERY, HEADER_QUERY} from '~/lib/fragments';
import resetStyles from '~/styles/reset.css?url';
import appStyles from '~/styles/app.css?url';
import tailwindStyles from '~/styles/tailwind.css?url';
import {PageLayout} from './components/PageLayout';
// import { PageLayout } from './newComponents/PageLayout';
// import { LandingPage } from './componentsMockup/Root'
import Mockup2Root from './componentsMockup2/App';
import { useState, useEffect } from 'react';

//import { Navigate } from 'react-router';

import { redirect } from 'react-router';
//import { createCookieSessionStorage } from '@shopify/remix-oxygen';

export type RootLoader = typeof loader;

// Password Protection for the entire site
// const sessionSecret = process.env.SESSION_SECRET || 'super-secret';
// const storage = createCookieSessionStorage({
//   cookie: {
//     name: 'password-session',
//     secure: true,
//     secrets: [sessionSecret],
//     sameSite: 'lax',
//     path: '/',
//     httpOnly: true,
//   },
// });

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
  actionResult, // Add this  
}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') return true;

  // If the action just happened, we MUST revalidate to check the new session state
  if (actionResult) return true;

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.pathname !== nextUrl.pathname) return true;
  //if (currentUrl.toString() === nextUrl.toString()) return true;

  // Defaulting to no revalidation for root loader data to improve performance.
  // When using this feature, you risk your UI getting out of sync with your server.
  // Use with caution. If you are uncomfortable with this optimization, update the
  // line below to `return defaultShouldRevalidate` instead.
  // For more details see: https://remix.run/docs/en/main/route/should-revalidate
  return false;
};

/**
 * The main and reset stylesheets are added in the Layout component
 * to prevent a bug in development HMR updates.
 *
 * This avoids the "failed to execute 'insertBefore' on 'Node'" error
 * that occurs after editing and navigating to another page.
 *
 * It's a temporary fix until the issue is resolved.
 * https://github.com/remix-run/remix/issues/9242
 */
export function links() {
  return [
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
    {rel: 'stylesheet', href: tailwindStyles},
  ];
}

export async function loader(args: Route.LoaderArgs) {

  console.log("[DxB][ root.tsx::loader() ][entry ] ----------------------------------->>>");
  const {storefront, env, session} = args.context; // session is an instance of AppSession

  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  //const session = await storage.getSession(args.request.headers.get('Cookie'));
  console.log("[DxB][loader] Session object:", session.data);

  //const passwordAllowed = session.has('passwordAllowed') && session.get('passwordAllowed') === true;
  const passwordValue = await session.get('passwordAllowed');
  const passwordAllowed = passwordValue === true;
  const storeLocked = env.PUBLIC_STORE_LOCKED === 'true';
  const storePassword = env.PUBLIC_STORE_PASSWORD || "012526";
  const adminBypass = env.PUBLIC_ADMIN_BYPASS_PASSWORD_ENABLED === 'true';
  const contactPageUrl = env.PUBLIC_CONTACT_PAGE_URL || "/contact";
  const shopPageUrl = env.PUBLIC_SHOP_PAGE_URL || "/shop";
  const whatsAppEnabled = env.PUBLIC_WHATSAPP_ENABLED || false;
  const siteSurveyEnabled = env.PUBLIC_SITE_SURVEY_ENABLED || false;

  console.log("[DxB][loader] storeLocked =", storeLocked);
  console.log("[DxB][loader] adminBypass =", adminBypass);
  console.log("[DxB][loader] passwordAllowed =", passwordAllowed);  

  //console.log("ENV:");
  //console.log(env);

  const url = new URL(args.request.url);
  console.log("[DxB][loader] pathname =", url.pathname);

  if (storeLocked && !adminBypass && !passwordAllowed && url.pathname !== '/password') {
    console.log("[DxB][loader] REDIRECTING to /password");    
    return redirect('/password', {
      headers: {
        'Set-Cookie': await session.commit(),
      },
    });
  } else {
    console.log("[DxB][loader]2 storeLocked =", storeLocked);
    console.log("[DxB][loader]2 adminBypass =", adminBypass);
    // This variable is "IF" the user has bypassed the password page by entering a password
    console.log("[DxB][loader]2 passwordAllowed =", passwordAllowed);
    console.log("[DxB][loader]2 contactPageUrl =", contactPageUrl);      
    console.log("[DxB][loader]2 shopPageUrl =", shopPageUrl);      
    console.log("[DxB][loader]2 pathname =", url.pathname);
    console.log("[DxB][loader] NO REDIRECT - continuing to render root");
  }

  // 1. Prepare the return object
  const loaderPayload = {
    ...deferredData,
    ...criticalData,
    serverPath: url.pathname, // useful for debugging in App()
    passwordAllowed,    
    env: {
      //storeLocked: env.PUBLIC_STORE_LOCKED === "true",
      storeLocked,
      adminBypassPasswordEnabled: adminBypass,
      storePassword: storePassword,
      contactPageUrl: contactPageUrl,
      shopPageUrl: shopPageUrl,
      whatsAppEnabled: whatsAppEnabled,
      siteSurveyEnabled: siteSurveyEnabled,
      message1: env.PUBLIC_STORE_MESSAGE1 || "",
      message2: env.PUBLIC_STORE_MESSAGE2 || "",
      message3: env.PUBLIC_STORE_MESSAGE3 || "",
      publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
    },    
    publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
    shop: getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    }),
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: false,
      country: args.context.storefront.i18n.country,
      language: args.context.storefront.i18n.language,
    },
  };

  // 2. Console log the payload
  // This will show up in your Shopify Admin -> Hydrogen -> Storefront -> Logs
  //console.log("[DxB][loader] FINAL loader payload:", JSON.stringify(loaderPayload, null, 2));


  return loaderPayload;
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context}: Route.LoaderArgs) {
  const {storefront} = context;

  const [header] = await Promise.all([
    storefront.query(HEADER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {
        headerMenuHandle: 'main-menu', // Adjust to your header menu handle
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {header};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  const {storefront, customerAccount, cart, env} = context;

  // defer the footer query (below the fold)
  const footer = storefront
    .query(FOOTER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {
        footerMenuHandle: 'footer',
      },
    })
    .catch((error: Error) => {
      console.error(error);
      return null;
    });
  return {
    cart: cart.get(),
    isLoggedIn: customerAccount.isLoggedIn(),
    footer,
    env,
  };
}

export function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href={resetStyles}></link>
        <link rel="stylesheet" href={appStyles}></link>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        {/* <ScrollRestoration nonce={nonce} /> */}
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  console.log("DxB - - - -- -- -- -- --- --- --- --- ---- ---- ---- ---- root.tsx ---- App()");
  const data = useRouteLoaderData<RootLoader>('root');
  const url = typeof window !== 'undefined' ? window.location.pathname : '';

  // Example: prevent site flash client-side
  if (data?.serverPath === '/password') {
    return <Outlet />; // Only render password page
  }

  console.log("[DxB][Past /password page check for url="+url);

  // ---------------- CLIENT-SIDE PASSWORD PROTECTION ----------------
  const [passwordBypass, setPasswordBypass] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPasswordBypass(localStorage.getItem('passwordBypass') === 'true');
    }
  }, []);


  if (!data) {
    return <Outlet />;
  }

  return (
    <Analytics.Provider
      cart={data.cart}
      shop={data.shop}
      consent={data.consent}
    >
      <Mockup2Root>
        <Outlet />
      </Mockup2Root>
    </Analytics.Provider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let errorMessage = 'Unknown error';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="route-error">
      <h1>Oops</h1>
      <h2>{errorStatus}</h2>
      {errorMessage && (
        <fieldset>
          <pre>{errorMessage}</pre>
        </fieldset>
      )}
    </div>
  );
}
