import Link from 'next/link';
import { Printer, ArrowRight } from 'lucide-react';
import { getSettings } from '@/app/actions/settings';
import { ThemeToggle } from '@/components/ThemeToggle';

export default async function HomePage() {
  const settings = await getSettings();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Printer className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">Raman Prints</span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 font-medium transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          {/* Service Availability Warning */}
          {!settings.isServiceAvailable && (
            <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg">
              <p className="text-yellow-900 dark:text-yellow-200 font-semibold text-lg">⚠️ Service Currently Unavailable</p>
              <p className="text-yellow-800 dark:text-yellow-300 text-sm mt-1">
                Our printing service is temporarily unavailable. Orders may be delayed.
              </p>
            </div>
          )}

          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6">
            Smart Printing for{' '}
            <span className="text-indigo-600 dark:text-indigo-400">Students</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Upload your documents, pay online, and collect your prints hassle-free. 
            Fast, affordable, and reliable printing service.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 font-semibold text-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-600 dark:border-indigo-500 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 font-semibold text-lg transition-all w-full sm:w-auto justify-center flex items-center"
            >
              Login to Dashboard
            </Link>
          </div>

          {/* Features */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Upload Documents</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Upload PDFs, DOCs, and more. We support all major formats.
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Pay Online</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Secure payment via Razorpay. Black & White printing at ₹{settings.serviceItems.find((item: any) => item.name.includes('Black & White'))?.price || 2} per page.
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Track Orders</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Real-time tracking from printing to ready for pickup.
              </p>
            </div>
          </div>

          {/* Admin Contact Info */}
          <div className="mt-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Contact Information</h2>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-full">
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium uppercase">Owner Name</p>
                  <p className="text-lg text-gray-900 dark:text-white font-semibold">{settings.adminContactName || 'Raman Prints'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-full">
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium uppercase">Phone Number</p>
                  <a
                    href={`https://wa.me/${(settings.adminContactPhone || '+91 98765 43210').replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline"
                  >
                    {settings.adminContactPhone || '+91 98765 43210'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2026 Raman Prints. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
