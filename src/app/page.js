"use client";

import { Mail, Zap, Clock, TrendingUp, Button, Input, Triangle, Facebook, Twitter, Instagram, Dribbble, Globe, ArrowRight, Star, Package } from "lucide-react";
import { Button as UIButton } from "@/components/ui/button";
import { Input as UIInput } from "@/components/ui/input";
import TiltedCard from "@/blocks/Components/TiltedCard/TiltedCard";
import { useState, useEffect } from "react";

const features = [
  {
    icon: Mail,
    title: "Digital Invoicing",
    description: "Complete FBR integrated electronic invoicing system with real-time reporting to FBR servers"
  },
  {
    icon: Zap,
    title: "Automated Tax Compliance",
    description: "Automatic tax calculations and reporting with 100% FBR API compliance for all transactions"
  },
  {
    icon: Clock,
    title: "Real-Time Monitoring",
    description: "Live transaction tracking and instant reporting to FBR with QR code verification"
  },
  {
    icon: TrendingUp,
    title: "Sales Analytics",
    description: "Comprehensive sales reporting and analytics with FBR compliant tax breakdowns"
  }
];

function FeaturesSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-4">
            FBR COMPLIANCE FEATURES
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
            Complete FBR Invoice Management
            <br />
            System Solutions
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <TiltedCard key={index} containerHeight="auto" rotateAmplitude={10} scaleOnHover={1.03} showTooltip={false} showMobileWarning={false}>
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </TiltedCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min((scrollTop / docHeight) * 100, 100);
      
      setScrollProgress(progress);
      setShowScrollButton(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="bg-gray-50 pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid lg:grid-cols-4 gap-12 mb-16">
          {/* Resources */}
          <div>
            <h3 className="font-bold text-gray-900 mb-6 flex items-center">
              FBR RESOURCES
              <div className="w-4 h-4 bg-purple-500 rounded ml-2"></div>
            </h3>
            <ul className="space-y-4">
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">FBR POS Integration</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Tax Compliance Guide</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Digital Invoicing</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">API Documentation</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Support Center</a></li>
            </ul>
          </div>

          {/* Information */}
          <div>
            <h3 className="font-bold text-gray-900 mb-6 flex items-center">
              SOLUTIONS
              <div className="w-4 h-4 bg-green-500 rounded ml-2"></div>
            </h3>
            <ul className="space-y-4">
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Tier-1 Retailers</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Restaurants & Hotels</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">FMCG Sector</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Wholesale Business</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold text-gray-900 mb-6 flex items-center">
              COMPLIANCE
              <div className="w-4 h-4 bg-blue-500 rounded-full ml-2"></div>
            </h3>
            <ul className="space-y-4">
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">FBR Guidelines</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Tax Regulations</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Certification</a></li>
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors flex items-center">
                  Get Support
                  <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full ml-2">24/7</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-bold text-gray-900 mb-6">
              Get FBR Integration Updates
            </h3>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              Subscribe to receive updates about FBR compliance requirements and new features
            </p>
            <div className="flex gap-2">
              <UIInput 
                placeholder="Email address" 
                className="flex-1 rounded-full border-gray-300 text-center"
              />
              <UIButton className="bg-blue-600 hover:bg-blue-700 rounded-full px-6 text-white">
                Subscribe
              </UIButton>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            {/* Logo and Legal */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Triangle className="w-8 h-8 text-blue-500 fill-blue-500" />
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 w-4 h-4 rounded-sm transform rotate-45 -translate-y-1 translate-x-1"></div>
                </div>
                <span className="text-gray-900 text-xl font-bold">TXS Digital Marketing</span>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <a href="#" className="hover:text-gray-900 transition-colors">Legal</a>
                <a href="#" className="hover:text-gray-900 transition-colors">Terms of use</a>
                <a href="#" className="hover:text-gray-900 transition-colors">Cookies</a>
                <a href="#" className="hover:text-gray-900 transition-colors">Privacy policy</a>
              </div>

              <div className="text-sm text-gray-600 max-w-2xl">
                <span className="font-semibold">* Disclaimer :</span> There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don&apos;t look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn&apos;t anything embarrassing
              </div>
            </div>

            {/* Contact and Social */}
            <div className="space-y-4 text-right">
              <div>
                <span className="text-gray-600">Contact us : </span>
                <a href="mailto:tradxsell.com" className="text-pink-500 hover:text-pink-600 transition-colors">
                  tradxsell@gmail.com
                </a>
              </div>
              
              <div>
                {/* <span className="text-gray-600 block mb-2">Follow us :</span>
                <div className="flex justify-end space-x-4">
                  <a href="#" className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-blue-500 hover:text-white transition-colors">
                    <Facebook className="w-4 h-4" />
                  </a>
                  <a href="#" className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-blue-400 hover:text-white transition-colors">
                    <Twitter className="w-4 h-4" />
                  </a>
                  <a href="#" className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-pink-500 hover:text-white transition-colors">
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a href="#" className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-pink-400 hover:text-white transition-colors">
                    <Dribbble className="w-4 h-4" />
                  </a>
                  <a href="#" className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-600 hover:text-white transition-colors">
                    <Globe className="w-4 h-4" />
                  </a>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button with Progress Animation */}
      {showScrollButton && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 group"
        >
          {/* Progress Circle */}
          <svg className="w-12 h-12 transform -rotate-90 absolute inset-0" viewBox="0 0 48 48">
            {/* Background circle */}
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="2"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth="2"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - scrollProgress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-300 ease-out"
            />
          </svg>
          
          {/* Arrow Icon */}
          <div className="w-4 h-4 border-t-2 border-r-2 border-white transform -rotate-45 -translate-y-0.5 relative z-10 group-hover:-translate-y-1 transition-transform duration-300"></div>
        </button>
      )}
    </footer>
  );
}

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Triangle className="w-8 h-8 text-blue-500 fill-blue-500" />
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 w-4 h-4 rounded-sm transform rotate-45 -translate-y-1 translate-x-1"></div>
            </div>
                            <span className="text-white text-xl font-bold">TXS Digital Marketing</span>
          </div>


          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <UIButton 
              className="bg-white text-slate-900 hover:bg-gray-100 rounded-full px-6"
              onClick={() => window.location.href = '/login'}
            >
              Sign In
            </UIButton>
          </div>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-0 w-64 h-32 bg-pink-500/20 rounded-tr-full"></div>
        <div className="absolute bottom-20 left-20 w-32 h-16 bg-green-500/20 rounded-lg transform rotate-12"></div>
        <div className="absolute bottom-10 right-20 w-48 h-24 bg-blue-500/20 rounded-lg transform -rotate-12"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-slate-700/30 rounded-full transform translate-x-1/2"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
              TXS Invoice
              <br />
              Management System
            </h1>
            
            <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
              Complete FBR integrated POS and invoice management solution for Pakistani retailers with real-time tax compliance and reporting
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <UIButton 
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-full text-lg"
                onClick={() => window.location.href = '/login'}
              >
                Sign In
              </UIButton>
            </div>
          </div>

          {/* Right Content - Dashboard Preview */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              {/* Dashboard Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-500 rounded"></div>
                  <div className="flex-1 bg-gray-100 rounded-full px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gray-300 rounded"></div>
                      <span className="text-sm text-gray-600">Search...</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-yellow-400 rounded-full"></div>
                  <div className="w-8 h-8 bg-orange-400 rounded-full"></div>
                </div>
              </div>

              {/* Project Tasks Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">FBR Sales Monitor</h3>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {Array.from({ length: 7 }, (_, i) => (
                    <div key={i} className="text-center">
                      <div className="text-xs text-gray-500 mb-1">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'][i]}
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                        i === 3 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {10 + i}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task Items */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-green-100 rounded-lg">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                    <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white"></div>
                  </div>
                  <span className="text-sm text-gray-700">FBR Integration</span>
                  <div className="ml-auto flex space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-yellow-100 rounded-lg">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full border-2 border-white"></div>
                    <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white"></div>
                  </div>
                  <span className="text-sm text-gray-700">Tax Calculation</span>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-orange-100 rounded-lg">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 bg-orange-500 rounded-full border-2 border-white"></div>
                  </div>
                  <span className="text-sm text-gray-700">Invoice Generation</span>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-blue-100 rounded-lg">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white"></div>
                  </div>
                  <span className="text-sm text-gray-700">Sales Reporting</span>
                </div>
              </div>

              {/* Right Side Panel */}
              <div className="absolute -right-20 top-0 w-64 bg-white rounded-xl shadow-lg p-4 transform -rotate-6">
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-gray-800">17:30</div>
                  <div className="text-sm text-gray-500">UK, WIL</div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-700">Today&apos;s Tasks</div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="text-xs font-medium">FBR Sync</div>
                      <div className="text-xs text-gray-500">Completed</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
                    <div>
                      <div className="text-xs font-medium">Tax Report</div>
                      <div className="text-xs text-gray-500">Pending</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm font-medium text-gray-700 mb-2">Sales Today</div>
                  <div className="text-3xl font-bold text-blue-600">Rs.47k</div>
                  <div className="text-xs text-gray-500">FBR Synced</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SolutionsSection() {
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Background decorative element */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="mb-16">
          <div className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-4">
            FBR COMPLIANCE SOLUTIONS
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight max-w-3xl">
            Complete Tax Compliance for Pakistani Retailers with FBR Integration
          </h2>
        </div>

        {/* Solutions Cards */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Card 1 */}
          <TiltedCard containerHeight="auto" rotateAmplitude={10} scaleOnHover={1.02} showTooltip={false} showMobileWarning={false}>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-transparent"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">
                  Tier-1 Retailer FBR Integration
                </h3>
                <p className="text-purple-100 leading-relaxed">
                  Complete POS integration with FBR for Tier-1 retailers. Real-time sales reporting, QR code generation, and fiscal invoice numbering with 100% compliance to avoid input tax restrictions.
                </p>
              </div>
              {/* Decorative lines */}
              <div className="absolute top-8 right-8 w-32 h-32 opacity-10">
                <div className="absolute inset-0 border-2 border-white rounded-full"></div>
                <div className="absolute inset-4 border-2 border-white rounded-full"></div>
                <div className="absolute inset-8 border-2 border-white rounded-full"></div>
              </div>
            </div>
          </TiltedCard>

          {/* Card 2 */}
          <TiltedCard containerHeight="auto" rotateAmplitude={10} scaleOnHover={1.02} showTooltip={false} showMobileWarning={false}>
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">
                  Digital Invoice Management
                </h3>
                <p className="text-blue-100 leading-relaxed">
                  Advanced digital invoicing system with inventory management, sales analytics, and automated tax calculations. Perfect for retailers, restaurants, and FMCG sector businesses.
                </p>
              </div>
              {/* Decorative geometric shapes */}
              <div className="absolute top-8 right-8 w-24 h-24 opacity-10">
                <div className="absolute inset-0 border-2 border-white transform rotate-45"></div>
                <div className="absolute inset-2 border-2 border-white transform rotate-45"></div>
              </div>
            </div>
          </TiltedCard>
        </div>
      </div>
    </section>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <SolutionsSection />
      <FeaturesSection />
      <Footer />
    </div>
  );
}
