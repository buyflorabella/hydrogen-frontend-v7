import type {Route} from './+types/account_.login';

export async function loader({request, context}: Route.LoaderArgs) {
  // DxB troubleshooting
  // return context.customerAccount.login({
  //   countryCode: context.storefront.i18n.country,
  // });
  console.log("DxB - login loader ------------> 11111");
  await context.customerAccount.handleAuthStatus();
  console.log("DxB - login loader ------------> 22222");
  return null;
}
