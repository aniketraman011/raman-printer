'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart, Clock, CheckCircle, XCircle, DollarSign, Users, UserCheck, AlertCircle, Eye, EyeOff, RotateCcw, Lock, X } from 'lucide-react';
import { formatCurrency } from '@/lib/constants';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [showRevenue, setShowRevenue] = useState(true);
  const [message, setMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/stats', {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setMessage(data.error || 'Failed to load stats');
      }
    } catch (error: any) {
      console.error('Failed to load stats:', error);
      setMessage('Failed to load dashboard statistics. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }

  const handleResetStats = async () => {
    if (!resetPassword.trim()) {
      setPasswordError('Password is required');
      return;
    }

    setResetting(true);
    setPasswordError('');
    
    try {
      const res = await fetch('/api/admin/stats/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPassword }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage('Dashboard stats reset successfully');
        setShowPasswordModal(false);
        setResetPassword('');
        await fetchStats();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setPasswordError(data.error || 'Failed to reset stats');
      }
    } catch (error) {
      setPasswordError('Failed to reset stats');
    } finally {
      setResetting(false);
    }
  };

  const openResetModal = () => {
    setShowPasswordModal(true);
    setResetPassword('');
    setPasswordError('');
  };

  const closeResetModal = () => {
    setShowPasswordModal(false);
    setResetPassword('');
    setPasswordError('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  // Calculate percentages
  const completedPercentage = stats?.totalOrders 
    ? Math.round((stats.completedOrders / stats.totalOrders) * 100) 
    : 0;
  const cancelledPercentage = stats?.totalOrders 
    ? Math.round((stats.cancelledOrders / stats.totalOrders) * 100) 
    : 0;
  const verifiedPercentage = stats?.totalUsers 
    ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) 
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <button
          onClick={openResetModal}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
        >
          <RotateCcw className="h-5 w-5" />
          Reset Stats
        </button>
      </div>

      {/* Password Modal for Reset */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Confirm Reset</h2>
              </div>
              <button
                onClick={closeResetModal}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Enter your admin password to reset dashboard stats. This will recalculate all counters from current data.
            </p>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
                {passwordError}
              </div>
            )}

            <input
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleResetStats()}
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={closeResetModal}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetStats}
                disabled={resetting}
                className="flex-1 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {resetting ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <RotateCcw className="h-5 w-5" />
                )}
                Reset Stats
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.includes('success')
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-400'
        }`}>
          {message}
        </div>
      )}

      {/* Top Stats Grid - Orders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Orders</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">{stats?.totalOrders || 0}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Recent: {stats?.recentOrders || 0}</p>
            </div>
            <div className="h-14 w-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Orders</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">{stats?.pendingOrders || 0}</p>
            </div>
            <div className="h-14 w-14 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
              <Clock className="h-7 w-7 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          {(stats?.pendingOrders || 0) > 0 && (
            <span className="inline-block px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs font-semibold rounded-full">
              Attention
            </span>
          )}
        </div>

        {/* Completed Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed Orders</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">{stats?.completedOrders || 0}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{completedPercentage}% of total</p>
            </div>
            <div className="h-14 w-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Cancelled Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cancelled Orders</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">{stats?.cancelledOrders || 0}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{cancelledPercentage}% of total</p>
            </div>
            <div className="h-14 w-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <XCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats Grid - Revenue & Users */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">
                {showRevenue ? formatCurrency(stats?.totalRevenue || 0) : '••••••'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Pending: {showRevenue ? formatCurrency(stats?.pendingRevenue || 0) : '••••••'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-14 w-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <DollarSign className="h-7 w-7 text-green-600 dark:text-green-400" />
              </div>
              <button
                onClick={() => setShowRevenue(!showRevenue)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {showRevenue ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Verified Users */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Verified Users</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">{stats?.verifiedUsers || 0}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{verifiedPercentage}% of total</p>
            </div>
            <div className="h-14 w-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <UserCheck className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Verifications</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">{stats?.pendingVerifications || 0}</p>
            </div>
            <div className="h-14 w-14 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="h-7 w-7 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          {(stats?.pendingVerifications || 0) > 0 && (
            <span className="inline-block px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 text-xs font-semibold rounded-full">
              Action Required
            </span>
          )}
        </div>

        {/* Recent Orders (24h) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Recent Orders (24h)</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">{stats?.recentOrders || 0}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Today: +{stats?.todayOrders || 0}</p>
            </div>
            <div className="h-14 w-14 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-7 w-7 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/orders"
          className="group bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-600 dark:hover:border-indigo-400 hover:-translate-y-1"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Manage Orders</h3>
              <p className="text-gray-600 dark:text-gray-400">View and update order statuses</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
          </div>
        </Link>

        <Link
          href="/admin/users"
          className="group bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-600 dark:hover:border-indigo-400 hover:-translate-y-1"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Manage Users</h3>
              <p className="text-gray-600 dark:text-gray-400">Verify users and manage accounts</p>
            </div>
            <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
          </div>
        </Link>

        <Link
          href="/admin/settings"
          className="group bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-600 dark:hover:border-indigo-400 hover:-translate-y-1"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Settings</h3>
              <p className="text-gray-600 dark:text-gray-400">Manage pricing and services</p>
            </div>
            <DollarSign className="h-8 w-8 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
          </div>
        </Link>
      </div>
    </div>
  );
}
