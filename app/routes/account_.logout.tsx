import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from 'react-router';

export async function loader({ context }: LoaderFunctionArgs) {
  return redirect('/login');
}

export async function action({context}: ActionFunctionArgs) {
  const {session, cart} = context;
  
  session.unset('customerAccessToken');
  await cart.updateBuyerIdentity({customerAccessToken: null});

  return redirect('/login', {
    headers: {
      'Set-Cookie': await session.commit(),
    },
  });
}
