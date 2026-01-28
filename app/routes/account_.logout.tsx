import { redirect } from 'react-router';
import type { Route } from './+types/account_.logout';

// Instrumentation: console.log everywhere
export async function loader() {
  console.log('LOGOUT ROUTE LOADER 🔹 called');

  // optional: show a message while redirecting
  //return redirect('/');
}

export async function action({ context }: Route.ActionArgs) {
  console.log('LOGOUT ROUTE ACTION 🔹 called');

  try {
    if (!context?.customerAccount) {
      console.error('LOGOUT 🔹 context.customerAccount is undefined!');
      return json({ success: false, message: 'No customer account in context' }, { status: 500 });
    }

    console.log('LOGOUT 🔹 calling customerAccount.logout()...');
    const result = await context.customerAccount.logout();
    console.log('LOGOUT 🔹 logout() result:', result);

    // Optionally check cookies
    if (context.request) {
      console.log('LOGOUT 🔹 request headers:', [...context.request.headers.entries()]);
    }

    console.log('DEBUG _ isLoggedIn: ' + context.customerAccount.isLoggedIn());

    return JSON.stringify({ isLoggedIn: context.customerAccount.isLoggedIn() });

    //return redirect('/');
  } catch (err) {
    console.error('LOGOUT 🔹 ERROR', err);
    throw err;
  }
}
