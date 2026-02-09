'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, Printer, ArrowLeft, FileText, Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/constants';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/admin/order/${params.id}`);
        const data = await res.json();
        if (data.success) {
          setOrder(data.order);
        }
      } catch (error) {
        console.error('Failed to load order');
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">Order not found</p>
      </div>
    );
  }

  const tokenId = `TK-${order._id}`;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.push('/admin/orders')}
        className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to Orders
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Order Information</h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Customer Name</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{order.user.fullName}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Phone Number</p>
              <a
                href={`https://wa.me/${order.user.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Your order is ready')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xl font-semibold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 flex items-center gap-2"
              >
                {order.user.whatsappNumber}
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Order ID</p>
              <p className="text-lg font-mono text-gray-900 dark:text-gray-300 font-semibold">{order._id.slice(-6)}</p>
            </div>

            {(order.pages !== undefined || order.copies !== undefined) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pages</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{order.pages ?? 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Copies</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{order.copies ?? 'N/A'}</p>
                </div>
              </div>
            )}

            {order.serviceItems && order.serviceItems.length > 0 && (
              <div className="col-span-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Service Items</p>
                <div className="space-y-2">
                  {order.serviceItems.map((item: any, index: number) => (
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

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(order.totalAmount)}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Order Date</p>
              <p className="text-lg text-gray-900 dark:text-gray-300">
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  month: 'numeric',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Print Side</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {order.printSide === 'SINGLE' ? 'Single-sided' : 'Double-sided'}
              </p>
            </div>

            {order.message && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Special Instructions</p>
                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <p className="text-gray-900 dark:text-gray-300">{order.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Files Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Files ({order.files.length})
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Click on individual files to view or download</p>
          </div>

          <div className="space-y-3">
            {order.files.map((file: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                    <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{file.fileName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {file.fileSize ? `${(file.fileSize / 1024).toFixed(2)} KB` : 'Document'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                    title="View file"
                  >
                    <Eye className="h-5 w-5" />
                  </a>
                  <a
                    href={file.fileUrl}
                    download={file.fileName}
                    className="p-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                    title="Download file"
                  >
                    <Download className="h-5 w-5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
