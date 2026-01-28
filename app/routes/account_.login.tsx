import type {Route} from './+types/account_.login';

export async function loader({request, context}: Route.LoaderArgs) {
  console.log("DxB ---- account_.login.tsx Loader ------------->");
  console.log("DxB ---- account_.login.tsx Loader ------------->");
  console.log("DxB ---- account_.login.tsx Loader ------------->");
  
  return context.customerAccount.login({
    countryCode: context.storefront.i18n.country,
  });
}
