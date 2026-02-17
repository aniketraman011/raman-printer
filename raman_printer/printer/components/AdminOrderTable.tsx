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
    const result = await updateOrderStatus(orderId, newStatus);
    if (!result.success) {
      alert(result.error || 'Failed to update status');
    }
    setUpdating(null);
    onUpdate();
  }

  async function handlePaymentStatusChange(orderId: string, newPaymentStatus: string) {
    setUpdating(orderId);
    if (newPaymentStatus === 'PAID') {
      const result = await updatePaymentStatus(orderId, '', '');
      if (!result.success) {
        alert(result.error || 'Failed to update payment status');
      }
    }
    setUpdating(null);
    onUpdate();
  }

  async function handleDelete(orderId: string) {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    setUpdating(orderId);
    const result = await deleteOrder(orderId);
    if (!result.success) {
      alert(result.error || 'Failed to delete order');
    }
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
                  {order.userId?.whatsappNumber ? (
                    <a
                      href={`https://wa.me/${order.userId.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Your order is ready')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium flex items-center gap-1"
                    >
                      {order.userId.whatsappNumber}
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </a>
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(order.totalAmount)}
                  </span>
                  {order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED' && (() => {
                    const paid = order.paidAmount || 0;
                    const remaining = order.totalAmount - paid;
                    return remaining > 0 ? (
                      <span className="block text-xs text-red-600 dark:text-red-400 font-semibold mt-0.5">
                        {paid > 0 ? `Remaining: ${formatCurrency(remaining)}` : `Unpaid: ${formatCurrency(remaining)}`}
                      </span>
                    ) : null;
                  })()}
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
