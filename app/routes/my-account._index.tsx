import { Package, MapPin, Settings, LogOut, Heart } from 'lucide-react';
import { Form } from 'react-router';
import { Link, useRouteLoaderData, type LoaderFunctionArgs } from 'react-router-dom';

const Account = () => {
  const { userData } = useRouteLoaderData('root');

  return <>
    <div className="grid pt-8 gap-8 px-8 mx-8">
      <div className="mb-2 mt-8">
        <h1 className="text-4xl font-bold text-white mb-2">My Account</h1>
        <div className="text-xs text-white/40 mb-2">
          [ Customer Id: {userData.id.split('/').pop()} ]
        </div>
        <p className="text-white/70">Welcome back{userData.firstName ? `, ${userData.firstName}` : ''}!</p>
      </div>
      <div className="glass border border-white/10 rounded-2xl p-6 pt-0">
        <nav className="space-y-2">
          <Link to="orders" className="flex items-center gap-3 px-4 py-3 bg-[#7cb342]/20 text-[#7cb342] rounded-xl font-semibold">
            <Package className="w-5 h-5" />
            Orders
          </Link>
          <Link to="addresses" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-white/70 hover:text-white rounded-xl transition-colors">
            <MapPin className="w-5 h-5" />
            Addresses
          </Link>
          {/* <a href="#wishlist" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-white/70 hover:text-white rounded-xl transition-colors">
            <Heart className="w-5 h-5" />
            Wishlist
          </a> */}
          <a href="#settings" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-white/70 hover:text-white rounded-xl transition-colors">
            <Settings className="w-5 h-5" />
            Settings
          </a>
          <Form method="POST" action="/my-account/logout">
            <button 
              type="submit" 
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-white/70 hover:text-white rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </Form>
        </nav>
      </div>
    </div>
  </>
}

export default Account;