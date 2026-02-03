'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Trash2, Download } from 'lucide-react';
import { updateOrderStatus, deleteOrder, updatePaymentStatus } from '@/app/actions/order';

interface AdminOrderTableProps {
  orders: any[];
  onUpdate: () => void;
}

export default function AdminOrderTable({ orders, onUpdate }: AdminOrderTableProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function getStatusColor(status: string) {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      PRINTING: 'bg-blue-100 text-blue-800 border border-blue-200',
      READY: 'bg-purple-100 text-purple-800 border border-purple-200',
      COMPLETED: 'bg-green-100 text-green-800 border border-green-200',
      CANCELLED: 'bg-red-100 text-red-800 border border-red-200',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border border-gray-200';
  }

  function getPaymentStatusColor(status: string) {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      PAID: 'bg-green-100 text-green-800 border border-green-200',
      UNPAID: 'bg-orange-100 text-orange-800 border border-orange-200',
      FAILED: 'bg-red-100 text-red-800 border border-red-200',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border border-gray-200';
  }

  function getPaymentDisplay(status: string) {
    return status === 'PAID' ? 'Verified' : status;
  }

  async function handleStatusChange(orderId: string, newStatus: string) {
    setUpdating(orderId);
    await updateOrderStatus(orderId, newStatus);
    setUpdating(null);
    onUpdate();
  }

  async function handlePaymentStatusChange(orderId: string, newPaymentStatus: string) {
    setUpdating(orderId);
    if (newPaymentStatus === 'PAID') {
      await updatePaymentStatus(orderId, '', '');
    }
    setUpdating(null);
    onUpdate();
  }

  async function handleDelete(orderId: string) {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    setUpdating(orderId);
    await deleteOrder(orderId);
    setUpdating(null);
    onUpdate();
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                Order ID
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                Customer
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                Phone
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                Amount
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                Payment
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                Date
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                    {order._id.slice(-6)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {order.userId?.fullName || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {order.userId?.whatsappNumber || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      disabled={updating === order._id}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(
                        order.status
                      )} cursor-pointer focus:ring-2 focus:ring-indigo-600 focus:outline-none`}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PRINTING">Printing</option>
                      <option value="READY">Ready</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                    {order.cancelRequested && (
                      <div className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded font-semibold">
                        Cancel Requested
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {(order.paymentMethod === 'COD' && (order.paymentStatus === 'UNPAID' || order.paymentStatus === 'PENDING')) ||
                   (order.paymentMethod === 'RAZORPAY' && order.paymentStatus === 'PENDING') ? (
                    <select
                      value={order.paymentStatus}
                      onChange={(e) => handlePaymentStatusChange(order._id, e.target.value)}
                      disabled={updating === order._id}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getPaymentStatusColor(
                        order.paymentStatus
                      )} cursor-pointer focus:ring-2 focus:ring-indigo-600 focus:outline-none`}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="UNPAID">Unpaid</option>
                      <option value="PAID">Verified</option>
                    </select>
                  ) : (
                    <span
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium inline-block ${getPaymentStatusColor(
                        order.paymentStatus
                      )}`}
                    >
                      {getPaymentDisplay(order.paymentStatus)}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'numeric',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/admin/orders/${order._id}`)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded-lg transition-colors"
                      title="View order details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(order._id)}
                      disabled={updating === order._id}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete order"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No orders found</p>
        </div>
      )}
    </div>
  );
}
