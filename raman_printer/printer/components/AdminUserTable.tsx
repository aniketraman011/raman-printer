'use client';

import { useState } from 'react';
import { Check, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  updateUserVerification,
  softDeleteUser,
} from '@/app/actions/user';

interface AdminUserTableProps {
  users: any[];
  onUpdate: () => void;
}

export default function AdminUserTable({ users, onUpdate }: AdminUserTableProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const selectableUsers = users.filter(u => u.role !== 'ADMIN');

  async function handleVerification(userId: string, isVerified: boolean, userName: string, whatsappNumber: string) {
    setUpdating(userId);
    const result = await updateUserVerification(userId, !isVerified);
    if (!result.success) {
      toast.error(result.error || 'Failed to update verification');
      setUpdating(null);
      return;
    }
    
    toast.success(isVerified ? 'User unverified' : 'User verified successfully');
    setUpdating(null);
    
    // If we just verified the user (they were not verified before), open WhatsApp
    if (!isVerified) {
      const message = encodeURIComponent(`${userName}, your account is verified now ✅. You can now place orders on RAMAN PRINTS. Welcome! 🖨️`);
      const phoneNumber = whatsappNumber.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    }
    
    onUpdate();
  }

  async function handleDelete(userId: string) {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      return;
    }

    setUpdating(userId);
    const result = await softDeleteUser(userId);
    if (!result.success) {
      toast.error(result.error || 'Failed to delete user');
    } else {
      toast.success('User deleted successfully');
    }
    setUpdating(null);
    onUpdate();
  }

  async function handleBulkVerification() {
    if (!confirm(`Are you sure you want to verify ${selectedUsers.size} users?`)) return;
    
    setBulkUpdating(true);
    const toastId = toast.loading(`Verifying ${selectedUsers.size} users...`);
    let successCount = 0;
    
    for (const userId of selectedUsers) {
      const result = await updateUserVerification(userId, true);
      if (result.success) successCount++;
    }
    
    setBulkUpdating(false);
    setSelectedUsers(new Set());
    
    if (successCount === selectedUsers.size) {
      toast.success(`Successfully verified ${successCount} users`, { id: toastId });
    } else {
      toast.error(`Partial success: Verified ${successCount} out of ${selectedUsers.size} users`, { id: toastId });
    }
    onUpdate();
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden transition-all duration-300">
      {selectedUsers.size > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/40 border-b border-indigo-100 dark:border-indigo-800/50 px-6 py-3 flex items-center justify-between animate-fade-in">
          <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">
            {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkVerification}
              disabled={bulkUpdating}
              className="text-xs px-3 py-1.5 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              Verify Selected
            </button>
            <button
              onClick={() => setSelectedUsers(new Set())}
              className="text-xs px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-4 text-left w-12">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-indigo-600 focus:ring-indigo-600 cursor-pointer h-4 w-4"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(new Set(selectableUsers.map(u => u._id)));
                    } else {
                      setSelectedUsers(new Set());
                    }
                  }}
                  checked={selectedUsers.size === selectableUsers.length && selectableUsers.length > 0}
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Full Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                WhatsApp
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                Year
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4">
                  {user.role !== 'ADMIN' && (
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-indigo-600 focus:ring-indigo-600 cursor-pointer h-4 w-4"
                      checked={selectedUsers.has(user._id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedUsers);
                        if (e.target.checked) {
                          newSelected.add(user._id);
                        } else {
                          newSelected.delete(user._id);
                        }
                        setSelectedUsers(newSelected);
                      }}
                    />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.fullName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 sm:hidden block mt-1">Year: {user.year}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm text-gray-900 dark:text-gray-300">{user.username}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <a
                    href={`https://wa.me/${user.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline"
                  >
                    {user.whatsappNumber}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                  <p className="text-sm text-gray-900 dark:text-gray-300">{user.year}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.isVerified ? (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                      VERIFIED
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                      PENDING
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {user.role !== 'ADMIN' && (
                      <>
                        <button
                          onClick={() => handleVerification(user._id, user.isVerified, user.fullName, user.whatsappNumber)}
                          disabled={updating === user._id}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                            user.isVerified
                              ? 'text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 ring-1 ring-transparent hover:ring-yellow-200 dark:hover:ring-yellow-800'
                              : 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 ring-1 ring-green-200 dark:ring-green-800 shadow-sm'
                          }`}
                          title={user.isVerified ? 'Unverify user' : 'Verify user'}
                        >
                          {user.isVerified ? (
                            <X className="h-5 w-5" />
                          ) : (
                            <Check className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          disabled={updating === user._id}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg transition-colors disabled:opacity-50 ring-1 ring-transparent hover:ring-red-200 dark:hover:ring-red-800"
                          title="Delete user permanently"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
