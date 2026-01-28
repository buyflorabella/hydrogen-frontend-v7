import { redirect } from 'react-router';
import { json } from '@shopify/remix-oxygen';
import type { Route } from './+types/account_.logout';

// Instrumentation: console.log everywhere
export async function loader() {
  console.log('LOGOUT ROUTE LOADER 🔹 called');

  // optional: show a message while redirecting
  //return redirect('/');
  return `<p>Logging out… Redirecting shortly.</p>`;
}

export async function action({context}: Route.ActionArgs) {
  console.log('LOGOUT ROUTE ACTION 🔹 called');

  if (!context.customerAccount) {
    console.log("No customer account found");
    return redirect('/account/login');
  }

  return context.customerAccount.logout();
}
