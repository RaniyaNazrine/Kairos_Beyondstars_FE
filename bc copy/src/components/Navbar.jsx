import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth } from '../lib/kairosClient';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(auth.isAuthenticated());
  const [uid, setUid] = useState(auth.getUid());
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  // Sync auth state whenever our custom event fires
  useEffect(() => {
    const syncUser = () => {
      setIsLoggedIn(auth.isAuthenticated());
      setUid(auth.getUid());
    };

    syncUser();

    // Listen for in-app auth events
    window.addEventListener('kairos-auth', syncUser);
    return () => window.removeEventListener('kairos-auth', syncUser);
  }, []);

  const handleLogout = async () => {
    await auth.logout();
    setIsLoggedIn(false);
    setUid(null);
    // Notify other components
    window.dispatchEvent(new Event('kairos-auth'));
    // Redirect to login page
    navigate('/auth');
  };

  return (
    <nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="relative bg-gradient-to-r from-primary-500 to-yellow-500 p-2 rounded-lg transition-transform duration-300 hover:scale-105">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-yellow-400 bg-clip-text text-transparent">
                Beyond Stars
              </span>
              <div className="text-xs text-gray-400 -mt-1">AI Dining Concierge</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {isLoggedIn ? (
              // User Profile Display
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-white font-medium">{uid ? uid.slice(0,8) + '…' : 'User'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400 text-sm font-semibold bg-green-400/10 px-3 py-1 rounded-full">
                    ✓ Completed
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-300 hover:text-white text-sm underline transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              // Default Navigation Links
              <>
                <Link
                  to="/"
                  className={`${
                    isActive('/') 
                      ? 'text-white bg-gradient-to-r from-orange-500 to-pink-500 shadow-lg shadow-orange-500/50' 
                      : 'text-gray-300 hover:text-white'
                  } px-5 py-2 rounded-full font-medium transition-all duration-300`}
                >
                  HOME
                </Link>
                <Link
                  to="/results"
                  className={`${
                    isActive('/results') 
                      ? 'text-white bg-gradient-to-r from-orange-500 to-pink-500 shadow-lg shadow-pink-500/50' 
                      : 'text-gray-300 hover:text-white'
                  } px-5 py-2 rounded-full font-medium transition-all duration-300`}
                >
                  EXPLORE
                </Link>
                <Link
                  to="/auth"
                  className={`${
                    isActive('/auth') 
                      ? 'text-white bg-gradient-to-r from-orange-500 to-pink-500 shadow-lg shadow-purple-500/50' 
                      : 'text-gray-300 hover:text-white'
                  } ml-4 px-5 py-2 rounded-full font-semibold transition-all duration-300`}
                >
                  GET STARTED
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-300 hover:text-white focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-800 border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-2">
            {isLoggedIn ? (
              // User Profile Display (Mobile)
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-white font-medium text-sm">{uid ? uid.slice(0,8) + '…' : 'User'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-400 text-xs font-semibold bg-green-400/10 px-3 py-1 rounded-full">
                    ✓ Completed
                  </span>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-gray-300 hover:text-white text-xs underline transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              // Default Navigation Links (Mobile)
              <>
                <Link
                  to="/"
                  className={`${
                    isActive('/') 
                      ? 'text-white bg-gradient-to-r from-orange-500 to-pink-500 shadow-lg shadow-orange-500/50' 
                      : 'text-gray-300 hover:text-white'
                  } block px-5 py-2 rounded-full font-medium transition-all duration-300`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  HOME
                </Link>
                <Link
                  to="/results"
                  className={`${
                    isActive('/results') 
                      ? 'text-white bg-gradient-to-r from-orange-500 to-pink-500 shadow-lg shadow-pink-500/50' 
                      : 'text-gray-300 hover:text-white'
                  } block px-5 py-2 rounded-full font-medium transition-all duration-300`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  EXPLORE
                </Link>
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${
                    isActive('/auth') 
                      ? 'text-white bg-gradient-to-r from-orange-500 to-pink-500 shadow-lg shadow-purple-500/50' 
                      : 'text-gray-300 hover:text-white'
                  } block text-center px-5 py-2 rounded-full font-semibold transition-all duration-300 mt-2`}
                >
                  GET STARTED
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
