'use client';

import { useState } from 'react';
import { FileText, Copy, Download, XCircle, AlertTriangle, Eye } from 'lucide-react';
import { formatCurrency, getStatusColor, getPaymentStatusColor } from '@/lib/constants';

interface OrderFile {
  fileName: string;
  fileUrl: string;
  fileSize: number;
}

interface OrderCardProps {
  order: {
    _id: string;
    fileName?: string;
    files?: OrderFile[];
    serviceItems?: Array<{name: string; price: number; quantity: number}>;
    pageCount?: number;
    copyCount?: number;
    colorMode?: 'BW' | 'COLOR';
    totalAmount: number;
    status: string;
    paymentStatus: string;
    cancelRequested?: boolean;
    cancelApprovedByAdmin?: boolean;
    createdAt: string;
  };
}

export default function OrderCard({ order }: OrderCardProps) {
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState('');

  const handleCancelRequest = async () => {
    if (!confirm('Are you sure you want to request cancellation of this order?')) {
      return;
    }

    setCancelling(true);
    try {
      const res = await fetch('/api/order/cancel-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order._id }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage('Cancel request submitted successfully');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMessage(data.error || 'Failed to submit cancel request');
      }
    } catch (error) {
      setMessage('Failed to submit cancel request');
    } finally {
      setCancelling(false);
    }
  };

  const handleUndoCancelRequest = async () => {
    if (!confirm('Are you sure you want to undo the cancellation request?')) {
      return;
    }

    setCancelling(true);
    try {
      const res = await fetch('/api/order/undo-cancel-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order._id }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage('Cancel request removed successfully');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMessage(data.error || 'Failed to remove cancel request');
      }
    } catch (error) {
      setMessage('Failed to remove cancel request');
    } finally {
      setCancelling(false);
    }
  };
  const statusSteps = [
    { label: 'Placed', value: 'PENDING' },
    { label: 'Printing', value: 'PRINTING' },
    { label: 'Ready', value: 'READY' },
    { label: 'Picked Up', value: 'COMPLETED' },
  ];

  const currentStepIndex = statusSteps.findIndex((step) => step.value === order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm animate-scale-in ${
          message.includes('success') 
            ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
            : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-400'
        }`}>
          {message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg truncate">
              {order.fileName || `Order ${order._id.slice(-6)}`}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
          <span className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${getPaymentStatusColor(order.paymentStatus)}`}>
            {order.paymentStatus}
          </span>
          {order.cancelRequested && (
            <span className="px-2.5 py-1 sm:px-3 sm:py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 text-xs font-semibold rounded-full">
              Cancel Requested
            </span>
          )}
        </div>
      </div>

      {/* Files */}
      {order.files && order.files.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploaded Files:</p>
          <div className="space-y-2">
            {order.files.map((file, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1 min-w-0">{file.fileName}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 rounded-md flex items-center justify-center gap-1.5 text-sm font-medium transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">View</span>
                  </a>
                  <a
                    href={file.fileUrl}
                    download={file.fileName}
                    className="flex-1 sm:flex-none px-3 py-2 bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600 rounded-md flex items-center justify-center gap-1.5 text-sm font-medium transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Service Items */}
      {order.serviceItems && order.serviceItems.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service Items:</p>
          <div className="space-y-2">
            {order.serviceItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {item.quantity} × ₹{item.price} = ₹{item.quantity * item.price}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Details */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {order.pageCount && (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Pages</p>
              <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{order.pageCount}</p>
            </div>
          </div>
        )}
        {order.copyCount && (
          <div className="flex items-center gap-2">
            <Copy className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Copies</p>
              <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{order.copyCount}</p>
            </div>
          </div>
        )}
        <div className="col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
          <p className="font-bold text-indigo-600 dark:text-indigo-400 text-base sm:text-lg">{formatCurrency(order.totalAmount)}</p>
        </div>
      </div>

      {/* Cancel Button */}
      {!isCancelled && order.status === 'PENDING' && !order.cancelRequested && (
        <button
          onClick={handleCancelRequest}
          disabled={cancelling}
          className="w-full sm:w-auto px-6 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 font-semibold mb-6"
        >
          <XCircle className="h-5 w-5" />
          {cancelling ? 'Requesting...' : 'Request Cancellation'}
        </button>
      )}

      {/* Undo Cancel Button */}
      {!isCancelled && order.cancelRequested && !order.cancelApprovedByAdmin && (
        <button
          onClick={handleUndoCancelRequest}
          disabled={cancelling}
          className="w-full sm:w-auto px-6 py-2 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 font-semibold mb-6"
        >
          <AlertTriangle className="h-5 w-5" />
          {cancelling ? 'Removing...' : 'Undo Cancel Request'}
        </button>
      )}

      {/* Progress Bar */}
      {!isCancelled ? (
        <div className="relative overflow-x-auto -mx-2 px-2">
          <div className="flex items-center justify-between min-w-max sm:min-w-0">
            {statusSteps.map((step, index) => {
              const isActive = index <= currentStepIndex;
              const isReady = step.value === 'READY' && order.status === 'READY';

              return (
                <div key={step.value} className="flex flex-col items-center flex-1 px-1">
                  <div
                    className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm transition-all ${
                      isActive
                        ? isReady
                          ? 'bg-green-500 text-white animate-pulse-green ring-4 ring-green-200 dark:ring-green-800'
                          : 'bg-indigo-600 dark:bg-indigo-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <p
                    className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 font-medium whitespace-nowrap ${
                      isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  {index < statusSteps.length - 1 && (
                    <div
                      className={`absolute top-4 sm:top-5 h-0.5 transition-all ${
                        index < currentStepIndex ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                      style={{
                        left: `${(index + 0.5) * (100 / statusSteps.length)}%`,
                        width: `${100 / statusSteps.length}%`,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Connecting Lines */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10" />
        </div>
      ) : (
        <div className="text-center py-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
          <p className="text-red-800 dark:text-red-400 font-semibold">This order has been cancelled</p>
        </div>
      )}
    </div>
  );
}
