import { useState } from 'react';
import { useLoaderData, Link, type LoaderFunctionArgs } from 'react-router';
import { CartForm } from '@shopify/hydrogen';
import { 
  // Star, 
  ShoppingCart, 
  Share2, 
  Heart, 
  Check, 
  Truck, 
  RefreshCw, 
  Shield, 
  // ThumbsUp 
} from 'lucide-react';

import { useCart } from '../componentsMockup2/contexts/CartContext';
import { useWishlist } from '../componentsMockup2/contexts/WishlistContext';
import { useFeatureFlags } from '../componentsMockup2/contexts/FeatureFlagsContext';
import AnnouncementBar from '../componentsMockup2/components/AnnouncementBar';
import DiscountBox from '../componentsMockup2/components/DiscountBox';

const PRODUCT_QUERY = `#graphql
  query Product($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      descriptionHtml
      description
      images(first: 10) {
        nodes {
          url
          altText
          width
          height
        }
      }
      variants(first: 1) {
        nodes {
          id
          title
          availableForSale
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          image {
            url
          }
        }
      }
      # Example of how to pull custom data via Metafields
      ingredients: metafield(namespace: "custom", key: "ingredients") {
        value
      }
      benefits: metafield(namespace: "custom", key: "benefits") {
        value
      }
    }
  }
`;

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { slug } = params;
  const { storefront } = context;

  const { product } = await storefront.query(PRODUCT_QUERY, {
    variables: {
      handle: slug,
      selectedOptions: [],
    },
  });

  if (!product) {
    throw new Response('Product Not Found', { status: 404 });
  }

  return { product };
}

export default function ProductDetailPage() {
  const { product } = useLoaderData<typeof loader>();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'ingredients'>('overview');
  
  const { openCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { flags } = useFeatureFlags();

  const variant = product.variants.nodes[0];
  const images = product.images.nodes;
  const price = parseFloat(variant.price.amount);
  const compareAtPrice = variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount) : null;
  
  // Parse metafields if they exist
  const benefitsList = product.benefits ? JSON.parse(product.benefits.value) : [];
  const ingredientsData = product.ingredients ? JSON.parse(product.ingredients.value) : [];

  const handleToggleWishlist = () => {
    toggleWishlist({
      id: product.id,
      name: product.title,
      slug: product.handle,
      price,
      image: images[0]?.url,
    });
  };

  return (
    <>
      <AnnouncementBar />
      <div className="min-h-screen bg-gradient-to-b from-[#0a0015] to-[#1a1a2e] pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-6">
            <Link to="/shop" className="text-white/50 hover:text-[#7cb342] transition-colors">
              ← Back to Shop
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            <div>
              <div className="glass border border-white/10 rounded-2xl overflow-hidden mb-4">
                <img
                  src={images[selectedImage]?.url}
                  alt={images[selectedImage]?.altText || product.title}
                  className="w-full h-[500px] object-cover"
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button
                      key={img.url}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === idx ? 'border-[#7cb342]' : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {product.title}
              </h1>
              
              {/* <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < 5 ? 'fill-[#7cb342] text-[#7cb342]' : 'text-white/20'}`}
                      />
                    ))}
                  </div>
                  <span className="text-white/70">5.0 (Review Sync via App)</span>
                </div>
              </div> */}

              <div className="flex items-baseline gap-4 mb-8">
                <span className="text-5xl font-bold text-white">
                  ${price.toFixed(2)}
                </span>
                {compareAtPrice && (
                  <span className="text-2xl text-white/40 line-through">
                    ${compareAtPrice.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-white font-semibold mb-2">Quantity:</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 glass border border-white/20 rounded-xl text-white hover:bg-white/10 transition-all"
                  >
                    -
                  </button>
                  <span className="text-2xl text-white font-bold w-16 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 glass border border-white/20 rounded-xl text-white hover:bg-white/10 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

                <CartForm
                  route="/cart"
                  action={CartForm.ACTIONS.LinesAdd}
                  inputs={{
                    lines: [
                      {
                        merchandiseId: product.variants.nodes[0]?.id,
                        quantity,
                      },
                    ],
                  }}
                >
                  {(fetcher) => (
                    <div className="flex gap-4 mb-8">
                      <button
                        type="submit"
                        disabled={!variant.availableForSale || fetcher.state !== 'idle'}
                        onClick={openCart}
                        className="flex-1 py-3 bg-[#7cb342] hover:bg-[#8bc34a] text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shiny-border relative z-10">
                        <ShoppingCart className="w-6 h-6" />
                        {variant.availableForSale ? 'Add to Cart' : 'Out of Stock'}
                      </button>
                    {/* {flags.wishlistIcon && (
                        <button
                          onClick={handleToggleWishlist}
                          className={`px-6 py-4 glass border rounded-xl transition-all ${
                            isInWishlist(product.id) ? 'border-[#7cb342] bg-[#7cb342]/10' : 'border-white/20 hover:bg-white/10'
                          }`}
                        >
                          <Heart className={`w-6 h-6 ${isInWishlist(product.id) ? 'fill-[#7cb342] text-[#7cb342]' : 'text-white'}`} />
                        </button>
                      )} */}
                      {/* <button className="px-6 py-4 glass border border-white/20 rounded-xl text-white hover:bg-white/10 transition-all">
                        <Share2 className="w-6 h-6" />
                      </button> */}
                    </div>
                  )}
                </CartForm>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="glass border border-white/10 rounded-xl p-4 text-center">
                  <Truck className="w-6 h-6 text-[#7cb342] mx-auto mb-2" />
                  <div className="text-sm text-white/70">Free Shipping</div>
                  <div className="text-xs text-white/50">On orders $75+</div>
                </div>
                <div className="glass border border-white/10 rounded-xl p-4 text-center">
                  <RefreshCw className="w-6 h-6 text-[#7cb342] mx-auto mb-2" />
                  <div className="text-sm text-white/70">Easy Returns</div>
                  <div className="text-xs text-white/50">60-day guarantee</div>
                </div>
                <div className="glass border border-white/10 rounded-xl p-4 text-center">
                  <Shield className="w-6 h-6 text-[#7cb342] mx-auto mb-2" />
                  <div className="text-sm text-white/70">Secure Payment</div>
                  <div className="text-xs text-white/50">SSL encrypted</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-16">
            <div className="flex gap-4 mb-8 border-b border-white/10 overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'overview' ? 'text-[#7cb342] border-b-2 border-[#7cb342]' : 'text-white/50 hover:text-white'
                }`}
              >
                Overview
              </button>
              {ingredientsData.length > 0 && (
                <button
                  onClick={() => setActiveTab('ingredients')}
                  className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'ingredients' ? 'text-[#7cb342] border-b-2 border-[#7cb342]' : 'text-white/50 hover:text-white'
                  }`}
                >
                  What's Inside
                </button>
              )}
            </div>

            <div className="glass border border-white/10 rounded-2xl p-8">
              {activeTab === 'overview' && (
                <div>
                  <h2 className="text-3xl font-bold text-white mb-6">Product Overview</h2>
                  <div 
                    className="text-white/70 text-lg leading-relaxed mb-8 prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                  />
                  {benefitsList.length > 0 && (
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-4">Key Benefits</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {benefitsList.map((benefit: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-3">
                            <Check className="w-6 h-6 text-[#7cb342] flex-shrink-0 mt-1" />
                            <span className="text-white/80">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'ingredients' && (
                <div>
                  <h2 className="text-3xl font-bold text-white mb-6">What's Inside</h2>
                  <div className="space-y-4">
                    {ingredientsData.map((ingredient: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-4 glass rounded-xl border border-white/10">
                        <div>
                          <div className="text-white font-semibold">{ingredient.name}</div>
                          <div className="text-white/50 text-sm">{ingredient.amount}</div>
                        </div>
                        <div className="text-[#7cb342] font-bold">{ingredient.daily_value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-16">
            <DiscountBox
              percentage={15}
              minPurchase={50}
              code="WELCOME15"
              description="Get 15% off your first order of $50 or more. Use code at checkout."
            />
          </div>
        </div>
      </div>
    </>
  );
}