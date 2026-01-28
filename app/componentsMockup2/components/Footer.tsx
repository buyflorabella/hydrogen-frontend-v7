import { Instagram, Facebook, Youtube, Twitter, CreditCard, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#0a0015] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <img
              src="/flora_bella_logo.png"
              alt="Flora Bella Trace Minerals"
              className="h-20 mb-4"
            />
            <p className="text-white/70 leading-relaxed mb-6">
              Making expert level soil care simple for everyday gardeners. Commercial grade trace
              minerals for home and professional growers.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="p-2 glass rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 glass rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 glass rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Youtube"
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 glass rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold heading-font text-white mb-6">Customer Care</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/policies/privacy" className="text-white/70 hover:text-[#ff1493] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/policies/terms" className="text-white/70 hover:text-[#ff1493] transition-colors">
                  Terms & Services
                </Link>
              </li>
              <li>
                <Link to="/policies/shipping" className="text-white/70 hover:text-[#ff1493] transition-colors">
                  Shipping Information
                </Link>
              </li>
              <li>
                <Link to="/policies/returns" className="text-white/70 hover:text-[#ff1493] transition-colors">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-white/70 hover:text-[#ff1493] transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-white/70 hover:text-[#ff1493] transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/account" className="text-white/70 hover:text-[#ff1493] transition-colors">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold heading-font text-white mb-6">Guides & Resources</h4>
            <ul className="space-y-3">
              <li>
                <a href="/learn" className="text-white/70 hover:text-[#ff1493] transition-colors">
                  Getting Started
                </a>
              </li>
              <li>
                <a href="/technical-docs" className="text-white/70 hover:text-[#ff1493] transition-colors">
                  Application Guide
                </a>
              </li>
              <li>
                <a href="/technical-docs" className="text-white/70 hover:text-[#ff1493] transition-colors">
                  Soil Testing
                </a>
              </li>
              <li>
                <a href="/community" className="text-white/70 hover:text-[#ff1493] transition-colors">
                  Grower Stories
                </a>
              </li>
              <li>
                <a href="/learn" className="text-white/70 hover:text-[#ff1493] transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold heading-font text-white mb-6">Stay Connected</h4>
            <p className="text-white/70 text-sm mb-4">
              Get growing tips and exclusive offers delivered to your inbox.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name');
                const email = formData.get('email');
                console.log('Newsletter signup:', { name, email });
                alert('Thank you for subscribing!');
                e.currentTarget.reset();
              }}
              className="space-y-3"
            >
              <input
                type="text"
                name="name"
                placeholder="Your name"
                required
                className="w-full glass border border-white/20 rounded-xl px-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#ff1493] transition-colors"
              />
              <input
                type="email"
                name="email"
                placeholder="Your email"
                required
                className="w-full glass border border-white/20 rounded-xl px-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#ff1493] transition-colors"
              />
              <button
                type="submit"
                className="w-full gradient-lime-magenta text-[#0a0015] py-2 rounded-xl font-bold text-sm hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                Subscribe
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/50 text-sm">
              © 2026 Flora Bella Trace Minerals. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex gap-2 items-center">
                <CreditCard className="w-8 h-8 text-white/30" />
                <CreditCard className="w-8 h-8 text-white/30" />
                <CreditCard className="w-8 h-8 text-white/30" />
                <CreditCard className="w-8 h-8 text-white/30" />
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-6 text-sm text-white/50">
            <Link to="/policies/privacy" className="hover:text-[#ff1493] transition-colors">
              Privacy Policy
            </Link>
            <Link to="/policies/terms" className="hover:text-[#ff1493] transition-colors">
              Terms of Service
            </Link>
            <Link to="/policies/shipping" className="hover:text-[#ff1493] transition-colors">
              Shipping Policy
            </Link>
            <Link to="/policies/returns" className="hover:text-[#ff1493] transition-colors">
              Returns & Refunds
            </Link>
            <Link to="/contact" className="hover:text-[#ff1493] transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
