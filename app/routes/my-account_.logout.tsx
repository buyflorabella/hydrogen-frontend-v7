import { type ActionFunctionArgs } from "react-router";

export async function loader() {
  return new Response(null, { status: 404 });
}

export async function action({ context }: ActionFunctionArgs) {
  return context.customerAccount.logout({
    postLogoutRedirectUri: '/account/login'
  });
}