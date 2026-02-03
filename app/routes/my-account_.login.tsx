// import type {Route} from './+types/account_.login';

// export async function loader({request, context}: Route.LoaderArgs) {
//   return context.customerAccount.login({
//     countryCode: context.storefront.i18n.country,
//   });
// }


// In app/routes/account_.login.tsx

export async function loader({request, context}: Route.LoaderArgs) {
  const url = new URL(request.url);
  
  // Check if this is an OAuth callback
  const isCallback = url.searchParams.has('code') || url.searchParams.has('state');
  
  if (isCallback) {
    // User just came back from Shopify OAuth - redirect to account
    return redirect('/account');
  }
  
  // If already logged in, redirect to account
  return await context.customerAccount.handleAuthStatus();
}