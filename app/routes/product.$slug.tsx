import { useState } from 'react';
import { useLoaderData, Link, type LoaderFunctionArgs } from 'react-router';
import { CartForm } from '@shopify/hydrogen';
import { 
  Star, 
  ShoppingCart, 
  Share2, 
  Heart, 
  Check, 
  Truck, 
  RefreshCw, 
  Shield,
  Package,
  ChevronUp,
  ChevronDown, 
  // ThumbsUp 
} from 'lucide-react';

import { useCart } from '../componentsMockup2/contexts/CartContext';
import { useWishlist } from '../componentsMockup2/contexts/WishlistContext';
import { useToast } from '../componentsMockup2/contexts/ToastContext';
import { useFeatureFlags } from '../componentsMockup2/contexts/FeatureFlagsContext';
import DiscountBox from '../componentsMockup2/components/DiscountBox';
import { products, faqs } from '~/componentsMockup2/data/staticData';
//import { Toast } from '../componentsMockup2/components/Toast.tsx';

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
      collections(first: 1) {
        nodes {
          id
          handle
          title
        }
      }
      # Also try direct access
      productOverviewMultiline: metafield(namespace: "custom", key: "product_overview_multiline") {
        value
        type
      }      
    }
  }
`;

const RELATED_PRODUCTS_QUERY = `#graphql
  query RelatedProducts($handle: String!) {
    collection(handle: $handle) {
      id
      title
      products(first: 3) {
        nodes {
          title
          handle
          description
          featuredImage {
            url
            altText
            width
            height
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 1) {
            nodes {
              id
              availableForSale
              price {
                amount
              }
            }
          }
        }
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

  const { collection } = await storefront.query(RELATED_PRODUCTS_QUERY, {
    variables: {
      handle: product.collections.nodes[0].handle
    },
  });

  return { product, related: collection.products.nodes };
}

export default function ProductDetailPage() {
  const { product, related } = useLoaderData<typeof loader>();
  const item = products.at(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [purchaseType, setPurchaseType] = useState('one-time');
  const [subscriptionFrequency, setSubscriptionFrequency] = useState();
  const [activeTab, setActiveTab] = useState<'overview' | 'ingredients' | 'how-to' | 'technical' | 'faq'>('overview');
  //const [toastMessage, setToastMessage] = useState<string | null>(null);  // ← ADD THIS

  const { openCart } = useCart();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const { isInWishlist, toggleWishlist } = useWishlist();
  const { flags } = useFeatureFlags();

  const variant = product.variants.nodes[0];
  const images = product.images.nodes;
  const price = parseFloat(variant.price.amount);
  const compareAtPrice = variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount) : null;
  
  // Parse metafields if they exist
  // const benefitsList = product.benefits ? JSON.parse(product.benefits.value) : [];
  // const ingredientsData = product.ingredients ? JSON.parse(product.ingredients.value) : [];

  const handleToggleWishlist = () => {
    toggleWishlist({
      id: product.id,
      name: product.title,
      slug: product.handle,
      price,
      image: images[0]?.url,
    });
  };

  const finalPrice = price * quantity;
  const isBundle = false;

  return (
    <>
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
              <div className="inline-block bg-[#7cb342] text-white px-4 py-1 rounded-full text-sm font-bold">
                Best Seller
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {product.title}
              </h1>

              <p className="text-xl text-white/70 mb-6">
                {product.description.substr(0, 160)}
                {product.description.length > 160 ? '...' : ''}
              </p>
              
              <div className="flex items-center gap-4 mb-6">
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
              </div>

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

              <div className="mb-6 space-y-3">
                <label className="block text-white font-semibold mb-2">Purchase Options:</label>
                <button
                  onClick={() => setPurchaseType('one-time')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    purchaseType === 'one-time'
                      ? 'border-[#7cb342] bg-[#7cb342]/10'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-semibold">One-time Purchase</div>
                      <div className="text-white/70">${price}</div>
                    </div>
                    {purchaseType === 'one-time' && (
                      <Check className="w-6 h-6 text-[#7cb342]" />
                    )}
                  </div>
                </button>

                {/* SUBSCRIPTON ABILITY TOGGLE */}
                {false && (
                  <>
                    <button
                      onClick={() => setPurchaseType('subscription')}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        purchaseType === 'subscription'
                          ? 'border-[#7cb342] bg-[#7cb342]/10'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold">Subscribe & Save</span>
                            <span className="bg-[#7cb342] text-white text-xs px-2 py-0.5 rounded-full">
                              {(product as any).subscription_discount}% OFF
                            </span>
                          </div>
                          <div className="text-white/70">${finalPrice.toFixed(2)} per delivery</div>
                        </div>
                        {purchaseType === 'subscription' && (
                          <Check className="w-6 h-6 text-[#7cb342]" />
                        )}
                      </div>
                    </button>
                    {purchaseType === 'subscription' && (
                      <div className="mt-3">
                        <label className="block text-white/70 text-sm mb-2">Delivery Frequency:</label>
                        <select
                          value={subscriptionFrequency}
                          onChange={(e) => setSubscriptionFrequency(e.target.value)}
                          className="w-full p-3 glass border border-white/20 rounded-xl text-white bg-transparent"
                        >
                          <option value="30" className="bg-[#1a1a2e]">Every 30 days</option>
                          <option value="60" className="bg-[#1a1a2e]">Every 60 days</option>
                          <option value="90" className="bg-[#1a1a2e]">Every 90 days</option>
                        </select>
                      </div>
                    )}
                  </>
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
                      className="flex-1 py-3 bg-[#7cb342] hover:bg-[#8bc34a] text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shiny-border relative z-10"
                    >
                      <ShoppingCart className="w-6 h-6" />
                      {variant.availableForSale ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                    
                    {flags.wishlistIcon && (
                      <button
                        onClick={() => {
                          const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
                          const shortcut = isMac ? '⌘+D' : 'Ctrl+D';
                          
                          if (window.sidebar?.addPanel) {
                            window.sidebar.addPanel(product.title, window.location.href, '');
                          } else if ((window.external as any)?.AddFavorite) {
                            (window.external as any).AddFavorite(window.location.href, product.title);
                          } else {
                            const alreadyInWishlist = isInWishlist(product.id);

                            handleToggleWishlist();

                            const message = alreadyInWishlist
                              ? 'Removed from wishlist'
                              : `Added to wishlist! Tip: Press ${shortcut} to bookmark in your browser`;

                            toast.success(message);
                          }
                        }}
                        className={`px-6 py-4 glass border rounded-xl transition-all ${
                          isInWishlist(product.id)
                            ? 'border-[#7cb342] bg-[#7cb342]/10'
                            : 'border-white/20 hover:bg-white/10'
                        }`}
                        title={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist (or press Ctrl+D to bookmark)'}
                      >
                        <Heart
                          className={`w-6 h-6 ${
                            isInWishlist(product.id)
                              ? 'fill-[#7cb342] text-[#7cb342]'
                              : 'text-white'
                          }`}
                        />
                      </button>
                    )}
                    
                    <button 
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: product.title,  // ← Fixed: item.name → product.title
                            text: product.description,  // ← Fixed: item.description → product.description
                            url: window.location.href,
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success('Link copied to clipboard!');
                        }
                      }}
                      className="px-6 py-4 glass border border-white/20 rounded-xl text-white hover:bg-white/10 transition-all"
                      title="Share this product"
                    >
                      <Share2 className="w-6 h-6" />
                    </button>
                  </div>
                )}
              </CartForm>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="glass border border-white/10 rounded-xl p-4 text-center">
                  <Truck className="w-6 h-6 text-[#7cb342] mx-auto mb-2" />
                  <div className="text-sm text-white/70">Quality Sourced</div>
                  <div className="text-xs text-white/50">Carefully selected inputs</div>
                </div>
                <div className="glass border border-white/10 rounded-xl p-4 text-center">
                  <RefreshCw className="w-6 h-6 text-[#7cb342] mx-auto mb-2" />
                  <div className="text-sm text-white/70">Consistent Supply</div>
                  <div className="text-xs text-white/50">Reliable, repeatable fulfillment</div>
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
            {['overview', 'ingredients', 'how-to', 'technical', 'faq'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'text-[#7cb342] border-b-2 border-[#7cb342]'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {tab === 'overview' && 'Overview'}
                {tab === 'ingredients' && "What's Inside"}
                {tab === 'how-to' && 'How to Use'}
                {tab === 'technical' && 'Technical'}
                {tab === 'faq' && 'FAQ'}
              </button>
            ))}
          </div>

          <div className="glass border border-white/10 rounded-2xl p-8">
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">{isBundle ? 'Bundle' : 'Product'} Overview</h2>
                {/* Display metafield if it exists, otherwise fall back to description */}
                {product.productOverviewMultiline?.value ? (
                  <div className="text-white/70 text-lg leading-relaxed mb-8 whitespace-pre-line">
                    {product.productOverviewMultiline.value}
                  </div>
                ) : (
                  <p className="text-white/70 text-lg leading-relaxed mb-8">
                    {product.description}
                  </p>
                )}
                {(item as any).benefits && (item as any).benefits.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-4">Key Benefits</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {(item as any).benefits.map((benefit: string, idx: number) => (
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

            {!isBundle && activeTab === 'ingredients' && (
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">{"What's Inside"}</h2>
                {(item as any).ingredients && (item as any).ingredients.length > 0 && (
                  <div className="space-y-4">
                    {(item as any).ingredients.map((ingredient: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 glass rounded-xl border border-white/10"
                      >
                        <div>
                          <div className="text-white font-semibold">{ingredient.name}</div>
                          <div className="text-white/50 text-sm">{ingredient.amount}</div>
                        </div>
                        <div className="text-[#7cb342] font-bold">{ingredient.daily_value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!isBundle && activeTab === 'how-to' && (
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">How to Use</h2>
                <p className="text-white/70 text-lg leading-relaxed">
                  {(item as any).how_to_use}
                </p>
              </div>
            )}

            {!isBundle && activeTab === 'technical' && (
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">Technical Information</h2>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-4">Formulation Overview</h3>
                    <div className="space-y-4">
                      <div className="p-4 glass rounded-xl border border-white/10">
                        <div className="flex items-start gap-3">
                          <Check className="w-6 h-6 text-[#7cb342] flex-shrink-0 mt-1" />
                          <div>
                            <span className="text-white font-semibold">Broad-spectrum trace minerals</span>
                            <p className="text-white/60 text-sm mt-1">Complete mineral profile for optimal plant nutrition</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 glass rounded-xl border border-white/10">
                        <div className="flex items-start gap-3">
                          <Check className="w-6 h-6 text-[#7cb342] flex-shrink-0 mt-1" />
                          <div>
                            <span className="text-white font-semibold">Naturally occurring humic and fulvic compounds</span>
                            <p className="text-white/60 text-sm mt-1">Enhances nutrient uptake and soil biology</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 glass rounded-xl border border-white/10">
                        <div className="flex items-start gap-3">
                          <Check className="w-6 h-6 text-[#7cb342] flex-shrink-0 mt-1" />
                          <div>
                            <span className="text-white font-semibold">Supports micronutrient availability</span>
                            <p className="text-white/60 text-sm mt-1">Chelated minerals for maximum plant absorption</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 glass rounded-xl border border-white/10">
                        <div className="flex items-start gap-3">
                          <Check className="w-6 h-6 text-[#7cb342] flex-shrink-0 mt-1" />
                          <div>
                            <span className="text-white font-semibold">Compatible with soil, coco, and compost systems</span>
                            <p className="text-white/60 text-sm mt-1">Versatile application across growing media</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white mb-4">Application Guidance</h3>
                    <div className="bg-[#7cb342]/10 border border-[#7cb342]/30 rounded-xl p-6">
                      <p className="text-white/80 leading-relaxed mb-4">
                        For detailed application rates, guaranteed analysis, and commercial use information, please refer to our comprehensive technical documentation.
                      </p>
                      <Link
                        to="/technical-docs"
                        className="inline-flex items-center gap-2 text-[#7cb342] font-semibold hover:gap-4 transition-all"
                      >
                        View Technical Documentation →
                      </Link>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white mb-4">Safety & Handling</h3>
                    <ul className="space-y-2 text-white/70">
                      <li className="flex items-start gap-2">
                        <span className="text-[#7cb342] mt-1">•</span>
                        <span>Store in a cool, dry place away from direct sunlight</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#7cb342] mt-1">•</span>
                        <span>Keep out of reach of children and pets</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#7cb342] mt-1">•</span>
                        <span>Use appropriate protective equipment when handling</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#7cb342] mt-1">•</span>
                        <span>Follow all label instructions and local regulations</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {!isBundle && activeTab === 'faq' && (
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {faqs.map((faq) => (
                    <div
                      key={faq.id}
                      className="glass border border-white/10 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                        className="w-full p-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                      >
                        <span className="text-white font-semibold pr-4">{faq.question}</span>
                        {expandedFAQ === faq.id ? (
                          <ChevronUp className="w-5 h-5 text-[#7cb342] flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-white/50 flex-shrink-0" />
                        )}
                      </button>
                      {expandedFAQ === faq.id && (
                        <div className="px-6 pb-6 text-white/70 leading-relaxed">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

          <div className="mb-16 hidden">
            <DiscountBox
              percentage={15}
              minPurchase={50}
              code="WELCOME15"
              description="Get 15% off your first order of $50 or more. Use code at checkout."
            />
          </div>

          {related.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-8">You May Also Like</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {related.map((relatedProduct) => (
                <Link
                  key={relatedProduct.handle}
                  to={`/product/${relatedProduct.handle}`}
                  className="glass border border-white/10 rounded-2xl overflow-hidden hover:border-[#7cb342]/50 transition-all duration-300 hover:scale-105 group"
                >
                  <img
                    src={relatedProduct.featuredImage.url}
                    alt={relatedProduct.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">{relatedProduct.title}</h3>
                    <p className="text-white/70 mb-4 line-clamp-2">{relatedProduct.description}</p>
                    <div className="text-2xl font-bold text-white">${relatedProduct.variants.nodes[0].price.amount}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}