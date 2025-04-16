'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LogOut, User, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
      }
    };

    fetchUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="bg-white border-b border-gray-200 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex">
            <h1 className="text-lg font-semibold">Architecture Timesheet</h1>
          </div>
          
          <div className="flex items-center">
            {user && (
              <div className="relative">
                <button
                  className="flex items-center p-2 rounded-full hover:bg-gray-100"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span className="mr-2 text-sm font-medium text-gray-700 hidden md:block">
                    {user.email}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    <User size={16} />
                  </div>
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <Link 
                      href="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <span className="flex items-center">
                        <User size={16} className="mr-2" />
                        Profile
                      </span>
                    </Link>
                    <Link 
                      href="/settings" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <span className="flex items-center">
                        <Settings size={16} className="mr-2" />
                        Settings
                      </span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <span className="flex items-center">
                        <LogOut size={16} className="mr-2" />
                        Sign out
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}