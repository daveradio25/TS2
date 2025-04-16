'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Clock, ArrowRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/timesheets');
      }
    };
    checkSession();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="flex justify-between items-center py-6">
          <div className="text-xl font-bold text-blue-800">Architecture Timesheet</div>
          <nav>
            <button 
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Sign In
            </button>
          </nav>
        </header>

        <main className="pt-16 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900">
                Track Time on <span className="text-blue-600">Architecture Projects</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600">
                A simple and effective timesheet system built specifically for architecture firms.
                Track hours by project and phase, submit for approval, and analyze your data.
              </p>
              <div className="mt-10">
                <button
                  onClick={() => router.push('/login')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md text-lg font-medium hover:bg-blue-700 flex items-center"
                >
                  Get Started
                  <ArrowRight className="ml-2" size={20} />
                </button>
              </div>
            </div>
            <div className="flex justify-center items-center">
              <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <div className="mx-auto h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-6">
                  <Clock size={48} />
                </div>
                <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">Key Features</h2>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                      1
                    </div>
                    <p className="ml-3 text-gray-700">Track time by project and phase</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                      2
                    </div>
                    <p className="ml-3 text-gray-700">Bi-monthly timesheet periods</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                      3
                    </div>
                    <p className="ml-3 text-gray-700">Approval workflow for managers</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                      4
                    </div>
                    <p className="ml-3 text-gray-700">Project budget tracking by phase</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>

        <footer className="py-8 border-t border-gray-200">
          <div className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Architecture Firm Timesheet. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}