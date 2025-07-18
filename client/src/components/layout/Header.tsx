import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { User } from '@shared/schema';
import { motion } from 'framer-motion';
import logo3D from '../../assets/img/logo-3d.png';
import { useAuth } from '@/hooks/use-auth';

interface HeaderProps {
  user: User | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logoutMutation } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'fa-home' },
    { label: 'Advisors', path: '/advisors', icon: 'fa-users' },
    { label: 'Angela AI', path: '/angela-chat', icon: 'fa-robot' },
    { label: 'Availability', path: '/availability', icon: 'fa-clock' },
    { label: 'Bookings', path: '/bookings', icon: 'fa-calendar-alt' },
    { label: 'Messages', path: '/messages', icon: 'fa-comments' },
    { label: 'Profile', path: '/profile', icon: 'fa-user' },
  ];
  
  // Add Top-up option to the user dropdown menu

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const isActive = (path: string) => {
    return location === path;
  };
  
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      // Redirect to home page after logout
      setLocation('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="border-b border-neutral-light sticky top-0 bg-white/90 backdrop-blur-sm z-30">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/dashboard">
            <div className="flex flex-col items-center cursor-pointer">
              <div className="logo-3d-container h-12 w-12 relative rounded-full overflow-hidden shadow-lg transform transition-transform hover:scale-105">
                <img 
                  src={logo3D} 
                  alt="AngelGuides.AI Logo" 
                  className="h-12 w-12 rounded-full object-cover"
                  style={{
                    transform: 'perspective(800px) rotateY(10deg)',
                    boxShadow: 'inset 0 0 10px rgba(255,255,255,0.5)',
                  }}
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500/20 to-transparent"></div>
              </div>
              <h1 className="font-sans text-sm font-extrabold bg-gradient-to-r from-purple-700 to-indigo-500 bg-clip-text text-transparent tracking-tight mt-1">
                AngelGuides.AI
              </h1>
            </div>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8 header-nav">
          {navItems.map((item) => (
            <Link href={item.path} key={item.path}>
              <div className={`navbar-item text-neutral-dark hover:text-primary transition duration-200 relative cursor-pointer ${
                isActive(item.path) ? 'text-primary' : ''
              }`}>
                {item.label}
                {isActive(item.path) && (
                  <motion.div 
                    className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" 
                    layoutId="navbar-indicator"
                  />
                )}
              </div>
            </Link>
          ))}
        </nav>
        
        {/* User profile and menu */}
        <div className="flex items-center space-x-4">
          <button className="text-neutral-dark hover:text-primary transition-colors duration-200 relative">
            <i className="far fa-bell text-lg"></i>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
              2
            </span>
          </button>
          
          <div className="relative group">
            <button className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-sm font-semibold">{user?.name.split(' ').map(n => n[0]).join('') || 'U'}</span>
                )}
              </div>
              <span className="hidden md:inline text-sm font-medium">{user?.name || 'User'}</span>
            </button>
            
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block border border-neutral-light z-50">
              <Link href="/profile">
                <div className="block px-4 py-2 text-sm text-neutral-dark hover:bg-neutral-lightest hover:text-primary cursor-pointer">Your Profile</div>
              </Link>
              <Link href="/topup">
                <div className="block px-4 py-2 text-sm text-neutral-dark hover:bg-neutral-lightest hover:text-primary cursor-pointer">
                  <i className="fas fa-coins mr-2 text-purple-500"></i>
                  Add Funds
                </div>
              </Link>
              <div onClick={() => setLocation('/profile')} className="block px-4 py-2 text-sm text-neutral-dark hover:bg-neutral-lightest hover:text-primary cursor-pointer">Settings</div>
              <hr className="my-1 border-neutral-light" />
              <div 
                onClick={handleLogout} 
                className="block px-4 py-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                Sign out
              </div>
            </div>
          </div>
          
          <button 
            className="md:hidden text-neutral-dark hover:text-primary"
            onClick={toggleMobileMenu}
          >
            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-lg`}></i>
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-white border-t border-neutral-light"
        >
          <div className="container mx-auto px-4 py-3">
            <nav className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <Link href={item.path} key={item.path}>
                  <div 
                    className={`flex items-center px-2 py-2 rounded-md cursor-pointer ${
                      isActive(item.path) 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-neutral-dark hover:bg-neutral-lightest hover:text-primary'
                    } transition duration-200`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <i className={`fas ${item.icon} w-6`}></i>
                    <span>{item.label}</span>
                  </div>
                </Link>
              ))}
              
              {/* Logout option for mobile menu */}
              <div 
                className="flex items-center px-2 py-2 rounded-md cursor-pointer text-red-500 hover:bg-red-50"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
              >
                <i className="fas fa-sign-out-alt w-6"></i>
                <span>Sign out</span>
              </div>
            </nav>
          </div>
        </motion.div>
      )}
    </header>
  );
};

export default Header;
