'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Trash2, Download, Printer, Loader2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateOrderStatus, deleteOrder, updatePaymentStatus } from '@/app/actions/order';

interface AdminOrderTableProps {
  orders: any[];
  isAutoPrintEnabled?: boolean;
  autoPrintDelaySeconds?: number;
  onUpdate: () => void;
}

export default function AdminOrderTable({ orders, isAutoPrintEnabled = false, autoPrintDelaySeconds = 10, onUpdate }: AdminOrderTableProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const router = useRouter();

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  function getStatusColor(status: string) {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      PRINTING: 'bg-blue-100 text-blue-800 border-blue-400 ring-2 ring-blue-300 animate-pulse shadow-sm',
      READY: 'bg-purple-100 text-purple-800 border-purple-200 shadow-sm',
      COMPLETED: 'bg-green-100 text-green-800 border-green-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200 opacity-80',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
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
      toast.error(result.error || 'Failed to update status');
    } else {
      toast.success('Status updated successfully');
    }
    setUpdating(null);
    onUpdate();
  }

  async function handlePaymentStatusChange(orderId: string, newPaymentStatus: string) {
    setUpdating(orderId);
    if (newPaymentStatus === 'PAID') {
      const result = await updatePaymentStatus(orderId, '', '');
      if (!result.success) {
        toast.error(result.error || 'Failed to update payment status');
      } else {
        toast.success('Payment verified successfully');
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
      toast.error(result.error || 'Failed to delete order');
    } else {
      toast.success('Order deleted');
    }
    setUpdating(null);
    onUpdate();
  }

  async function handlePrintNow(orderId: string) {
    setUpdating(orderId);
    const toastId = toast.loading('Sending to printer...');
    try {
      const res = await fetch('/api/admin/print-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Sent to printer!', { id: toastId });
      } else {
        toast.error(data.error || 'Failed to print', { id: toastId });
      }
    } catch (error) {
      toast.error('Network error during print', { id: toastId });
    }
    setUpdating(null);
    onUpdate();
  }

  async function handleBulkStatusUpdate(newStatus: string) {
    if (!confirm(`Update ${selectedOrders.size} orders to ${newStatus}?`)) return;
    
    setBulkUpdating(true);
    const toastId = toast.loading(`Updating ${selectedOrders.size} orders...`);
    let successCount = 0;
    
    for (const orderId of selectedOrders) {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result.success) successCount++;
    }
    
    setBulkUpdating(false);
    setSelectedOrders(new Set());
    
    if (successCount === selectedOrders.size) {
      toast.success(`Successfully updated ${successCount} orders`, { id: toastId });
    } else {
      toast.error(`Partial success: Updated ${successCount} out of ${selectedOrders.size} orders`, { id: toastId });
    }
    onUpdate();
  }

  async function handleBulkPaymentVerify() {
    if (!confirm(`Verify payment for ${selectedOrders.size} orders?`)) return;
    
    setBulkUpdating(true);
    const toastId = toast.loading(`Verifying ${selectedOrders.size} payments...`);
    let successCount = 0;
    
    for (const orderId of selectedOrders) {
      const result = await updatePaymentStatus(orderId, '', '');
      if (result.success) successCount++;
    }
    
    setBulkUpdating(false);
    setSelectedOrders(new Set());
    
    if (successCount === selectedOrders.size) {
      toast.success(`Successfully verified ${successCount} orders`, { id: toastId });
    } else {
      toast.error(`Partial success: Verified ${successCount} out of ${selectedOrders.size} orders`, { id: toastId });
    }
    onUpdate();
  }

  async function handleBulkDelete() {
    if (!confirm(`Are you sure you want to permanently delete ${selectedOrders.size} selected order(s)? This will delete their uploaded files and cannot be undone.`)) {
      return;
    }
    
    setBulkUpdating(true);
    const toastId = toast.loading(`Deleting ${selectedOrders.size} orders...`);
    let successCount = 0;
    
    for (const orderId of selectedOrders) {
      const result = await deleteOrder(orderId);
      if (result.success) successCount++;
    }
    
    setBulkUpdating(false);
    setSelectedOrders(new Set());
    
    if (successCount === selectedOrders.size) {
      toast.success(`Successfully deleted ${successCount} orders`, { id: toastId });
    } else {
      toast.error(`Partial success: Deleted ${successCount} out of ${selectedOrders.size} orders`, { id: toastId });
    }
    onUpdate();
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
      {selectedOrders.size > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/40 border-b border-indigo-100 dark:border-indigo-800/50 px-6 py-3 flex items-center justify-between animate-fade-in flex-wrap gap-4">
          <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">
            {selectedOrders.size} order{selectedOrders.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-indigo-700 dark:text-indigo-400 font-medium mr-1">Mark as:</span>
            <button
              onClick={() => handleBulkStatusUpdate('PRINTING')}
              disabled={bulkUpdating}
              className="text-xs px-3 py-1.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Printing
            </button>
            <button
              onClick={() => handleBulkStatusUpdate('COMPLETED')}
              disabled={bulkUpdating}
              className="text-xs px-3 py-1.5 bg-[#22c55e] text-white font-medium rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              Completed
            </button>
            <button
              onClick={() => handleBulkPaymentVerify()}
              disabled={bulkUpdating}
              className="text-xs px-3 py-1.5 bg-[#22c55e] text-white font-medium rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 ml-2"
            >
              Verify Selected
            </button>
            <button
              onClick={() => handleBulkDelete()}
              disabled={bulkUpdating}
              className="text-xs px-3 py-1.5 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1 ml-2"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedOrders(new Set())}
              className="text-xs px-3 py-1.5 bg-slate-800 text-gray-200 font-medium rounded-md hover:bg-slate-700 transition-colors ml-2"
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
                      setSelectedOrders(new Set(orders.map(o => o._id)));
                    } else {
                      setSelectedOrders(new Set());
                    }
                  }}
                  checked={selectedOrders.size === orders.length && orders.length > 0}
                />
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                Order ID
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                Customer
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                Amount
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400 hidden md:table-cell">
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
              <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-indigo-600 focus:ring-indigo-600 cursor-pointer h-4 w-4"
                    checked={selectedOrders.has(order._id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedOrders);
                      if (e.target.checked) {
                        newSelected.add(order._id);
                      } else {
                        newSelected.delete(order._id);
                      }
                      setSelectedOrders(newSelected);
                    }}
                  />
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                    {order._id.slice(-6)}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 block sm:hidden">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block">
                    {order.userId?.fullName || 'Unknown'}
                  </span>
                  {order.userId?.whatsappNumber ? (
                    <a
                      href={`https://wa.me/${order.userId.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Your order is ready')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium flex items-center gap-1 mt-1"
                    >
                      {order.userId.whatsappNumber}
                    </a>
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100 block tracking-tight">
                      {formatCurrency(order.totalAmount)}
                    </span>
                    {order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED' && (
                      <span className="text-[11px] font-bold text-red-500 mt-0.5 block tracking-tight">
                        Unpaid: {formatCurrency(order.totalAmount - (order.paidAmount || 0))}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="relative">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        disabled={updating === order._id || bulkUpdating}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${getStatusColor(
                          order.status
                        )} cursor-pointer focus:ring-2 focus:ring-indigo-600 focus:outline-none w-full max-w-[140px] appearance-none transition-all`}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PRINTING">Printing</option>
                        <option value="READY">Ready</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                      {order.status === 'PRINTING' && (
                        <Printer className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600 animate-bounce" />
                      )}
                    </div>
                    {order.cancelRequested && (
                      <div className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded font-semibold mt-1">
                        Cancel Requested
                      </div>
                    )}
                    {isAutoPrintEnabled && order.status === 'PENDING' && !order.cancelRequested && (() => {
                      const scheduleDate = new Date(new Date(order.createdAt).getTime() + autoPrintDelaySeconds * 1000);
                      const scheduleStr = scheduleDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
                      const secondsLeft = Math.max(0, autoPrintDelaySeconds - Math.floor((currentTime - new Date(order.createdAt).getTime()) / 1000));
                      
                      return (
                        <div className="text-[11px] font-medium text-purple-600 dark:text-purple-400 mt-2 flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 opacity-90">
                            <Clock className="h-3 w-3" />
                            Scheduled: {scheduleStr}
                          </span>
                          <span className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/30 w-max px-1.5 py-0.5 rounded text-purple-700 dark:text-purple-300">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Prints in {secondsLeft}s
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                  {(order.paymentMethod === 'COD' && (order.paymentStatus === 'UNPAID' || order.paymentStatus === 'PENDING')) ||
                   (order.paymentMethod === 'RAZORPAY' && order.paymentStatus === 'PENDING') ? (
                    <select
                      value={order.paymentStatus}
                      onChange={(e) => handlePaymentStatusChange(order._id, e.target.value)}
                      disabled={updating === order._id || bulkUpdating}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getPaymentStatusColor(
                        order.paymentStatus
                      )} cursor-pointer focus:ring-2 focus:ring-indigo-600 focus:outline-none appearance-none`}
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
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium text-gray-900 dark:text-gray-100 font-mono tracking-tight">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-wide">
                      {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => router.push(`/admin/orders/${order._id}`)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded-lg transition-colors ring-1 ring-transparent hover:ring-blue-200 dark:hover:ring-blue-800"
                      title="View order details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handlePrintNow(order._id)}
                      disabled={updating === order._id || bulkUpdating}
                      className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 p-2 rounded-lg transition-colors ring-1 ring-transparent hover:ring-purple-200 dark:hover:ring-purple-800 disabled:opacity-50"
                      title="Print order immediately"
                    >
                      <Printer className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(order._id)}
                      disabled={updating === order._id || bulkUpdating}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg transition-colors disabled:opacity-50 ring-1 ring-transparent hover:ring-red-200 dark:hover:ring-red-800"
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
