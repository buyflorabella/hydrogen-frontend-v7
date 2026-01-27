import { Form, useActionData, useRouteLoaderData, useLoaderData, redirect, useNavigate } from 'react-router';
//import { createCookieSessionStorage } from '@shopify/remix-oxygen';
import type { ActionFunction, LoaderFunctionArgs, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import '../styles/password.css'; // Custom CSS for sparkles/fireworks

// NOTE: This storage config should ideally match the one used in root.tsx
// Many devs move this to a 'app/lib/session.server.ts' to keep it DRY.
// const sessionSecret = process.env.SESSION_SECRET || 'super-secret';
// const storage = createCookieSessionStorage({
//   cookie: {
//     name: 'password-session',
//     secure: true,
//     secrets: [sessionSecret],
//     sameSite: 'lax',
//     path: '/',
//     httpOnly: true,
//     maxAge: 5 * 60, // 5 minutes in seconds    
//   },
// });


type Props = {
  canEnterStore: boolean;
};

export function EnterStoreButton({ canEnterStore }: Props) {
  if (canEnterStore) {
    return (
      <Link to="/" className="btn">
        Enter Store
      </Link>
    );
  }

  return (
    <button type="submit" className="btn">
      Enter Store
    </button>
  );
}

// ---------------------- LOADER ----------------------
export async function loader({ request, context }: LoaderFunctionArgs) {
  const { session } = context;
  const isLoggedIn = (await session.get('passwordAllowed')) === true;
  return { isLoggedIn };
}

// ---------------------- ACTION ----------------------
export const action: ActionFunction = async ({ request, context }) => {
  const { session, env } = context;  
  const formData = await request.formData();
  const _action = formData.get('_action');  
  const passwordAttempt = formData.get('password') as string;
  const correctPassword = env.PUBLIC_STORE_PASSWORD;

  //const session = await storage.getSession(request.headers.get('Cookie'));
  // Handle Logout
  if (_action === 'logout') {
    console.log("---------------------- USER IS LOGGING OUT !!!!!!!!!!!!!!!!!");
    session.unset('passwordAllowed');

    // 2. IMPORTANT: We must commit the session to generate the 'Set-Cookie' header
    const cookie = await session.commit();

    return redirect('/', {
      headers: {
        'Set-Cookie': cookie,
      },
    });
  } else {
    console.log("---------- NOT logging out ------");
  }


  if (passwordAttempt === correctPassword) {
    session.set('passwordAllowed', true);

    // Redirect back to home with the newly set cookie
    return redirect('/', {
      headers: {
        'Set-Cookie': await session.commit(),
      },
    });
  }

  // Logout action (if triggered)
  // if (formData.get('_action') === 'logout') {
  //   console.log("[DxB]User is logging out!");

  //   session.unset('passwordAllowed');
  //   return redirect('/password', {
  //     headers: { 'Set-Cookie': await storage.commitSession(session) },
  //   });
  // }  

  return { error: 'Incorrect password, try again.' };
};

// ---------------------- COMPONENT ----------------------
export default function PasswordPage() {
  const loaderData = useRouteLoaderData<RootLoader>('root');  
  const { isLoggedIn } = useLoaderData<typeof loader>();  
  const actionData = useActionData<{ error?: string }>();
  //const storePassword = loaderData?.env?.storePassword ?? 'UNKNOWN';  
  const [fireworksEnabled, setFireworksEnabled] = useState(false); 
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);  
  const [errorVisible, setErrorVisible] = useState(false);  
  const navigate = useNavigate();
  const storePassword = loaderData?.env?.storePassword || "unset";

  const canEnterStore = isLoggedIn === true;
  const handleSubmit = (e: React.FormEvent) => {
    if (canEnterStore) {
      e.preventDefault();
      navigate('/');
      return;
    }
  }

  // Trigger mounting once the component is ready in the browser
  useEffect(() => {
    setMounted(true);
  }, []);  

  useEffect(() => {
    if (actionData?.error) {
      setErrorVisible(true); // show
      const timeout = setTimeout(() => {
        setErrorVisible(false); // hide after 5s
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [actionData?.error]);  

  // Simple sparkles trigger
  // useEffect(() => {
  //   const interval = setInterval(() => setFireworksEnabled(prev => !prev), 500);
  //   return () => clearInterval(interval);
  // }, []);

  //const debugPassword = storePassword || '⚠️ Not set';
  //const debugPassword = "storePassword" || '⚠️ Not set';

  return (
    <div className="password-page min-h-screen flex flex-col items-center justify-center bg-[#1a1a1a] p-6">
      {/* Static background */}
      <div className="fireworks-background"></div>

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        
        {/* Orbiting flowers */}
        {/* The Orbit Container */}
        <div 
          className={`flower-orbit transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        >
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`flower flower-${i + 1}`}>
              🌸
            </div>
          ))}
        </div>

        {/* Status */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isLoggedIn ? 'Access Granted' : 'Store Locked'}
          </h1>

          <div className={`mt-3 p-3 rounded-xl border ${isLoggedIn ? 'bg-green-50 border-green-100' : 'bg-yellow-50 border-yellow-100'}`}>
            <p className={`${isLoggedIn ? 'text-green-700' : 'text-yellow-700'} font-semibold text-sm`}>
              {isLoggedIn ? 'Store is currently unlocked' : 'Store is locked — enter password below'}
            </p>
          </div>
        </div>

        {/* --- MAIN FORM --- */}
        <Form method="post" className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {!isLoggedIn && (
            <>
              <p className="text-green-700 font-bold text-center text-sm">
                Enter password below:
              </p>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  autoFocus
                  className="password-input-black p-4 w-full border-4 border-[#7cb342] rounded-xl bg-black text-white outline-none placeholder:text-gray-500 pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold uppercase text-[#7cb342] hover:text-white transition-colors"
                >
                  {showPassword ? 'Hide 👁️' : 'Show 👁️‍🗨️'}
                </button>
              </div>
            </>
          )}

          <button
            type="submit"
            className="bg-[#7cb342] text-white p-4 rounded-xl font-bold hover:bg-[#6fa32d] transition-all"
          >
            {isLoggedIn ? 'Enter Store' : 'Unlock Store'}
          </button>

          {actionData?.error && errorVisible && (
            <div
              className={`p-3 border rounded-lg border-red-100 bg-red-50 text-red-600 text-sm text-center font-medium
                transition-opacity duration-500
                ${errorVisible ? 'opacity-100' : 'opacity-0'}
              `}
            >
              {actionData.error}
            </div>
          )}

        </Form>

        {/* --- LOGOUT SECTION --- */}
        {isLoggedIn && (
          <Form method="post" action="/password" className="mt-6 text-center">
            <input type="hidden" name="_action" value="logout" />
            <button
              type="submit"
              className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors"
            >
              Lock store again (Logout)
            </button>
          </Form>
        )}
      </div>
    </div>
  );

}
