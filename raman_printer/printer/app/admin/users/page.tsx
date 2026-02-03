'use client';

import { useEffect, useState } from 'react';
import { getAllUsers } from '@/app/actions/user';
import AdminUserTable from '@/components/AdminUserTable';
import { Users, Search, Filter } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    async function fetchUsers() {
      const result = await getAllUsers();
      if (result.success) {
        setUsers(result.users || []);
      }
      setLoading(false);
    }

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    // Hide admin users and deleted users
    if (user.role === 'ADMIN' || user.isDeleted) return false;

    // Search filter (name, username, or phone number)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        user.fullName?.toLowerCase().includes(query) ||
        user.username?.toLowerCase().includes(query) ||
        user.whatsappNumber?.includes(query);
      if (!matchesSearch) return false;
    }

    // Year filter
    if (yearFilter !== 'all' && user.year !== yearFilter) return false;

    // Status filter
    if (statusFilter === 'verified' && !user.isVerified) return false;
    if (statusFilter === 'pending' && user.isVerified) return false;

    return true;
  });

  const handleReset = () => {
    setSearchQuery('');
    setYearFilter('all');
    setStatusFilter('all');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Management ({users.filter(u => !u.isDeleted && u.role !== 'ADMIN').length})
          </h1>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by name, username, or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>
          </div>

          {/* Year Filter */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Years</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
            <option value="Passout">Passout</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
          </select>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
          >
            <Filter className="h-5 w-5" />
            Reset
          </button>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-12 text-center">
          <Users className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Users Found</h3>
          <p className="text-gray-600 dark:text-gray-400">No users match the selected filter.</p>
        </div>
      ) : (
        <AdminUserTable
          users={filteredUsers}
          onUpdate={() => window.location.reload()}
        />
      )}
    </div>
  );
}
