'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Printer, Home, PlusCircle, History, LogOut, User, MessageSquare } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface DashboardNavProps {
  user: {
    name?: string | null;
    role?: string;
    isVerified?: boolean;
  };
}

export default function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/dashboard/new', label: 'New Print', icon: PlusCircle },
    { href: '/dashboard/history', label: 'My Orders', icon: History },
    { href: '/dashboard/feedback', label: 'Feedback', icon: MessageSquare },
    { href: '/dashboard/profile', label: 'Edit Profile', icon: User },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Printer className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
              Raman Prints
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isNewPrint = item.href === '/dashboard/new';
              const isDisabled = isNewPrint && !user?.isVerified;
              
              if (isDisabled) {
                return (
                  <div
                    key={item.href}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600"
                    title="Account verification required"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </div>
                );
              }
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
              {user?.name}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation (Bottom Fixed Bar) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 flex justify-around items-center h-16 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isNewPrint = item.href === '/dashboard/new';
            const isDisabled = isNewPrint && !user?.isVerified;
            
            if (isDisabled) {
              return (
                <div
                  key={item.href}
                  className="flex flex-col items-center justify-center w-full h-full py-1 opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-500"
                  title="Account verification required"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                </div>
              );
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full py-1 transition-colors ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <div className={`relative flex items-center justify-center p-1 rounded-full ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}>
                  <Icon className={`h-5 w-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                </div>
                <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
