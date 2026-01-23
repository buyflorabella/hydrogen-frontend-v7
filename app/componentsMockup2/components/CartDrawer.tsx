import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { Link } from 'react-router-dom';

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, subtotal, isCartOpen, closeCart, itemCount } = useCart();

  if (!isCartOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={closeCart}
      />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0a0015] z-50 shadow-2xl overflow-hidden flex flex-col border-l border-white/10">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Shopping Cart ({itemCount})</h2>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300 hover:rotate-90"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <ShoppingBag className="w-12 h-12 text-white/30" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Your cart is empty</h3>
            <p className="text-white/50 text-center mb-6">
              Add some products to get started!
            </p>
            <Link
              to="/shop"
              onClick={closeCart}
              className="px-6 py-3 bg-[#7cb342] hover:bg-[#8bc34a] text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105"
            >
              Shop Now
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.map(item => (
                <div
                  key={item.id}
                  className="glass border border-white/10 rounded-xl p-4 flex gap-4"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{item.name}</h3>
                    {item.variantName && (
                      <p className="text-sm text-white/50 mb-1">{item.variantName}</p>
                    )}
                    {item.isSubscription && (
                      <p className="text-xs text-[#7cb342] mb-2">
                        Subscribe & Save ({item.subscriptionFrequency})
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-4 h-4 text-white" />
                        </button>
                        <span className="text-white font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-xs text-white/50 hover:text-red-400 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Subtotal</span>
                <span className="text-2xl font-bold text-white">${subtotal.toFixed(2)}</span>
              </div>
              <p className="text-sm text-white/50 text-center">
                Shipping and taxes calculated at checkout
              </p>
              <Link
                to="/checkout"
                onClick={closeCart}
                className="block w-full py-4 bg-[#7cb342] hover:bg-[#8bc34a] text-white rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 text-center"
              >
                Proceed to Checkout
              </Link>
              <button
                onClick={closeCart}
                className="w-full py-3 border border-white/20 hover:bg-white/5 text-white rounded-xl font-semibold transition-all duration-300"
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
