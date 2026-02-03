'use client';

import { useMemo } from 'react';
import { CreditCard } from 'lucide-react';
import { calculatePrice, formatCurrency, PRICING } from '@/lib/constants';

interface PriceCalculatorProps {
  pageCount: number;
  setPageCount: (value: number) => void;
  copyCount: number;
  setCopyCount: (value: number) => void;
  onPayment: (totalAmount: number) => void;
  loading?: boolean;
  disabled?: boolean;
  pricePerPage?: number;
}

export default function PriceCalculator({
  pageCount,
  setPageCount,
  copyCount,
  setCopyCount,
  onPayment,
  loading = false,
  disabled = false,
  pricePerPage = PRICING.BW,
}: PriceCalculatorProps) {
  // Calculate total price (B/W only)
  const totalAmount = useMemo(() => {
    return pageCount * pricePerPage * copyCount;
  }, [pageCount, copyCount, pricePerPage]);

  return (
    <div className="space-y-6">
      {/* Page Count */}
      <div>
        <label htmlFor="pageCount" className="block text-sm font-medium text-gray-700 mb-2">
          Number of Pages
        </label>
        <input
          id="pageCount"
          type="number"
          min="1"
          value={pageCount}
          onChange={(e) => setPageCount(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-lg font-semibold"
        />
      </div>

      {/* Copy Count */}
      <div>
        <label htmlFor="copyCount" className="block text-sm font-medium text-gray-700 mb-2">
          Number of Copies
        </label>
        <input
          id="copyCount"
          type="number"
          min="1"
          value={copyCount}
          onChange={(e) => setCopyCount(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-lg font-semibold"
        />
      </div>

      {/* Print Mode Info */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Print Mode</label>
        <div className="px-4 py-3 rounded-lg font-semibold bg-gray-900 text-white">
          Black & White Only
          <div className="text-sm font-normal mt-1">₹{PRICING.BW}/page</div>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="bg-slate-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Pages: {pageCount}</span>
          <span>Copies: {copyCount}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Rate: ₹{pricePerPage}/page</span>
          <span>B/W</span>
        </div>
        <div className="border-t border-gray-300 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Total Amount</span>
            <span className="text-3xl font-bold text-indigo-600">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Pay Button */}
      <button
        onClick={() => onPayment(totalAmount)}
        disabled={loading || disabled}
        className="w-full py-4 bg-indigo-600 text-white rounded-lg font-semibold text-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <CreditCard className="h-6 w-6" />
        {loading ? 'Processing...' : `Pay ${formatCurrency(totalAmount)} with Razorpay`}
      </button>

      {disabled && (
        <p className="text-sm text-gray-500 text-center">
          Please upload a file to continue
        </p>
      )}
    </div>
  );
}
