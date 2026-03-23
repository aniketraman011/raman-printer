'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Package, CheckCircle, CreditCard, Loader2, Printer } from 'lucide-react';
import { getUserOrders } from '@/app/actions/order';
import OrderCard from '@/components/OrderCard';

export default function OrderHistoryPage() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [payingAll, setPayingAll] = useState(false);
  const [payAllError, setPayAllError] = useState('');
  const [userPhone, setUserPhone] = useState<string>('');

  const fetchOrders = useCallback(async () => {
    const result = await getUserOrders();
    if (result.success) {
      setOrders(result.orders || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      setSuccess('Payment successful! Your order has been placed.');
      setTimeout(() => setSuccess(''), 5000);
    }
    fetchOrders();
    
    // 15-second Auto Refresh
    const intervalId = setInterval(() => {
      fetchOrders();
    }, 15000);
    
    // Prefetch user phone number for Razorpay prefill
    fetch('/api/user/profile')
      .then(res => res.json())
      .then(data => { if (data.user) setUserPhone(data.user.whatsappNumber || ''); })
      .catch(() => {});
      
    return () => clearInterval(intervalId);
  }, [searchParams, fetchOrders]);

  // Calculate total remaining balance across all unpaid non-cancelled orders
  const totalRemaining = orders.reduce((sum, order) => {
    if (order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED') {
      return sum + (order.totalAmount - (order.paidAmount || 0));
    }
    return sum;
  }, 0);

  const unpaidOrderCount = orders.filter(
    (o) => o.paymentStatus !== 'PAID' && o.status !== 'CANCELLED' && (o.totalAmount - (o.paidAmount || 0)) > 0
  ).length;

  const handlePayAll = async () => {
    setPayingAll(true);
    setPayAllError('');

    if (!(window as any).Razorpay) {
      setPayAllError('Payment gateway is loading. Please try again in a moment.');
      setPayingAll(false);
      return;
    }

    try {
      const res = await fetch('/api/order/pay-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!data.success) {
        setPayAllError(data.error || 'Failed to initiate payment');
        setPayingAll(false);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: Math.round(data.amount * 100),
        currency: 'INR',
        name: 'Raman Prints',
        description: `Pay all ${data.orderCount} order(s)`,
        order_id: data.razorpayOrderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/order/pay-all/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderIds: data.orderIds,
              }),
            });

            if (verifyRes.ok) {
              setSuccess(`Payment successful! ${data.orderCount} order(s) marked as paid.`);
              setTimeout(() => setSuccess(''), 5000);
              fetchOrders();
            } else {
              setPayAllError('Payment verification failed. Contact support.');
            }
          } catch {
            setPayAllError('Payment verification failed.');
          } finally {
            setPayingAll(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPayingAll(false);
          },
        },
        prefill: {
            contact: userPhone,
          },
          theme: { color: '#4F46E5' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function () {
        setPayAllError('Payment failed. Please try again.');
        setPayingAll(false);
      });
      rzp.open();
    } catch {
      setPayAllError('Something went wrong. Please try again.');
      setPayingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Orders</h1>

        {/* Pay All Button */}
        {unpaidOrderCount > 0 && totalRemaining > 0 && (
          <button
            onClick={handlePayAll}
            disabled={payingAll}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {payingAll ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CreditCard className="h-5 w-5" />
            )}
            {payingAll ? 'Processing...' : `Pay All ₹${totalRemaining.toFixed(0)}`}
            {!payingAll && (
              <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-md">
                {unpaidOrderCount} order{unpaidOrderCount > 1 ? 's' : ''}
              </span>
            )}
          </button>
        )}
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          <p className="text-green-800 dark:text-green-400 font-medium">{success}</p>
        </div>
      )}

      {payAllError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-400 text-sm">{payAllError}</p>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-900/10 dark:to-transparent pointer-events-none"></div>
          
          <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-indigo-50 dark:bg-indigo-900/30 mb-6 group">
            <Package className="h-10 w-10 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute -top-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-sm">
              <Printer className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Orders Yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm mx-auto">
            You haven't placed any orders yet. Upload a document and experience our fast printing service!
          </p>
          <a
            href="/dashboard/new"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <Printer className="w-5 h-5" />
            Place New Order
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} userPhone={userPhone} />
          ))}
        </div>
      )}
    </div>
  );
}
