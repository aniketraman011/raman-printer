'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, CreditCard, Banknote, Loader2 } from 'lucide-react';
import { FileUpload } from '@/components/ui/file-upload';

function ScrollableNumberInput({
  value,
  onChange,
  min,
  max,
  disabled = false,
}: {
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  disabled?: boolean;
}) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  const stopAutoChange = () => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  useEffect(() => {
    return () => stopAutoChange();
  }, []);

  // Keep editValue in sync when value changes externally (e.g. from buttons)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(String(value));
    }
  }, [value, isEditing]);

  // Add non-passive wheel listener for preventing scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (disabled) return;
      e.preventDefault();
      if (e.deltaY < 0) onChange(Math.min(value + 1, max));
      else onChange(Math.max(value - 1, min));
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [value, min, max, disabled, onChange]);

  const startAutoChange = (direction: 'up' | 'down') => {
    stopAutoChange();
    let localValue = value;
    const doAction = () => {
      localValue = direction === 'up' ? Math.min(localValue + 1, max) : Math.max(localValue - 1, min);
      onChange(localValue);
    };
    doAction();
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(doAction, 80);
    }, 400);
  };

  const commitEdit = () => {
    setIsEditing(false);
    const parsed = parseInt(editValue, 10);
    if (isNaN(parsed)) {
      setEditValue(String(value));
      return;
    }
    const clamped = Math.max(min, Math.min(max, parsed));
    onChange(clamped);
    setEditValue(String(clamped));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitEdit();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setEditValue(String(value));
      setIsEditing(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={`transition-all duration-300 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <div ref={containerRef} className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onMouseDown={() => startAutoChange('down')}
          onMouseUp={stopAutoChange}
          onMouseLeave={stopAutoChange}
          onTouchStart={(e) => { e.preventDefault(); startAutoChange('down'); }}
          onTouchEnd={stopAutoChange}
          disabled={disabled || value <= min}
          className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-90 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed text-2xl font-bold select-none border border-red-200 dark:border-red-800"
        >
          −
        </button>
        <div
          className="flex-1 flex items-center justify-center px-4 py-2.5 sm:py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl min-w-[80px] hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors cursor-text"
          onClick={() => {
            if (!disabled) {
              setIsEditing(true);
              setTimeout(() => inputRef.current?.select(), 0);
            }
          }}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              autoFocus
              min={min}
              max={max}
              className="w-full text-center text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tabular-nums bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          ) : (
            <span
              key={value}
              className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tabular-nums animate-number-pop"
            >
              {value}
            </span>
          )}
        </div>
        <button
          type="button"
          onMouseDown={() => startAutoChange('up')}
          onMouseUp={stopAutoChange}
          onMouseLeave={stopAutoChange}
          onTouchStart={(e) => { e.preventDefault(); startAutoChange('up'); }}
          onTouchEnd={stopAutoChange}
          disabled={disabled || value >= max}
          className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 active:scale-90 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed text-2xl font-bold select-none border border-green-200 dark:border-green-800"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function NewOrderPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState<number>(0);
  const [copies, setCopies] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD'>('RAZORPAY');
  const [printSide, setPrintSide] = useState<'SINGLE' | 'DOUBLE'>('SINGLE');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isCodEnabled, setIsCodEnabled] = useState(true);
  const [isServiceAvailable, setIsServiceAvailable] = useState(true);
  const [serviceUnavailableMessage, setServiceUnavailableMessage] = useState('');
  const [pricePerPage, setPricePerPage] = useState(2);
  const [loading, setLoading] = useState(true);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<{id: string; name: string; price: number; quantity: number}[]>([]);
  const [countingPages, setCountingPages] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [pageDetails, setPageDetails] = useState<{name: string; pages: number; type: string}[]>([]);
  const [detectedPages, setDetectedPages] = useState<number>(0);
  const [userPhone, setUserPhone] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  const hasFiles = files.length > 0;
  const printingCost = hasFiles ? pages * copies * pricePerPage : 0;
  const servicesCost = selectedServices.reduce((sum, s) => sum + (s.price * s.quantity), 0);
  const totalAmount = printingCost + servicesCost;

  useEffect(() => {
    // Check verification status and prefetch user details for Razorpay
    fetch('/api/user/profile')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setIsVerified(data.user.isVerified === true);
          setUserPhone(data.user.whatsappNumber || '');
          setUserName(data.user.fullName || '');
        } else {
          setIsVerified(false);
        }
      })
      .catch(() => setIsVerified(false));

    // Fetch settings
    fetch('/api/settings', {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
      .then(res => res.json())
      .then(data => {
        setIsCodEnabled(data.isCodEnabled);
        setIsServiceAvailable(data.isServiceAvailable !== false);
        setServiceUnavailableMessage(data.serviceUnavailableMessage || 'Service is currently unavailable. Please try again later.');
        const bwPrice = data.serviceItems?.find((item: any) => item.name.includes('Black & White'))?.price || 2;
        setPricePerPage(bwPrice);
        const otherServices = data.serviceItems?.filter((item: any) => !item.name.includes('Black & White')) || [];
        setAvailableServices(otherServices);
        if (!data.isCodEnabled && paymentMethod === 'COD') {
          setPaymentMethod('RAZORPAY');
        }
      })
      .catch(err => console.error('Failed to load settings:', err))
      .finally(() => setLoading(false));
  }, []);

  // Auto-detect page count when files change
  const handleFilesChange = async (newFiles: File[]) => {
    setFiles(newFiles);
    setError('');

    if (newFiles.length === 0) {
      setPages(0);
      setDetectedPages(0);
      setPageDetails([]);
      return;
    }

    // Validate
    if (newFiles.length > 10) {
      setError('Maximum 10 files allowed per upload');
      return;
    }

    const totalSize = newFiles.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > 40 * 1024 * 1024) {
      setError('Total file size exceeds 40MB limit');
      return;
    }

    const oversizedFile = newFiles.find(f => f.size > 4 * 1024 * 1024);
    if (oversizedFile) {
      setError(`File too large: ${oversizedFile.name}. Maximum size per file is 4MB`);
      return;
    }

    // Auto page count detection
    setCountingPages(true);
    try {
      const formData = new FormData();
      newFiles.forEach(f => formData.append('files', f));

      const res = await fetch('/api/page-count', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const rawPages = data.totalPages || 1;
        setDetectedPages(rawPages);
        setPageDetails(data.fileDetails || []);
        // Apply double-sided logic
        if (printSide === 'DOUBLE') {
          setPages(Math.ceil(rawPages / 2));
        } else {
          setPages(rawPages);
        }
      }
    } catch (err) {
      console.error('Page count detection failed:', err);
    } finally {
      setCountingPages(false);
    }
  };

  // When print side changes, adjust pages automatically
  const handlePrintSideChange = (side: 'SINGLE' | 'DOUBLE') => {
    setPrintSide(side);
    if (detectedPages > 0) {
      if (side === 'DOUBLE') {
        setPages(Math.ceil(detectedPages / 2));
      } else {
        setPages(detectedPages);
      }
    }
  };

  const addServiceItem = (serviceName: string) => {
    const existing = selectedServices.find(s => s.name === serviceName);
    if (existing) {
      setSelectedServices(selectedServices.map(s =>
        s.name === serviceName ? {...s, quantity: s.quantity + 1} : s
      ));
    } else {
      const service = availableServices.find(s => s.name === serviceName);
      if (service) {
        setSelectedServices([...selectedServices, {
          id: Date.now().toString(),
          name: service.name,
          price: service.price,
          quantity: 1
        }]);
      }
    }
    setError('');
  };

  const decrementServiceItem = (serviceName: string) => {
    const existing = selectedServices.find(s => s.name === serviceName);
    if (existing) {
      if (existing.quantity > 1) {
        setSelectedServices(selectedServices.map(s =>
          s.name === serviceName ? {...s, quantity: s.quantity - 1} : s
        ));
      } else {
        setSelectedServices(selectedServices.filter(s => s.name !== serviceName));
      }
    }
  };

  const getServiceQuantity = (serviceName: string): number => {
    return selectedServices.find(s => s.name === serviceName)?.quantity || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (files.length === 0 && selectedServices.length === 0) {
      setError('Please upload files or select at least one service');
      return;
    }

    if (files.length > 0 && pages < 1) {
      setError('Please enter valid number of pages');
      return;
    }

    if (pages > 199) {
      setError('Maximum 199 pages allowed per order');
      return;
    }

    if (files.length > 0 && copies < 1) {
      setError('Please enter valid number of copies');
      return;
    }

    if (copies > 20) {
      setError('Maximum 20 copies allowed per order');
      return;
    }

    try {
      setUploading(true);

      let uploadedFiles = null;

      // Upload files if any
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append('files', file);
        });

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadError = await uploadRes.json().catch(() => null);
          throw new Error(uploadError?.error || 'Failed to upload files. Please try again.');
        }

        uploadedFiles = await uploadRes.json();
      }

      // Build service items
      const serviceItems = [];
      if (files.length > 0) {
        serviceItems.push({
          name: 'B/W Printing',
          price: pricePerPage,
          quantity: pages * copies,
        });
      }
      serviceItems.push(...selectedServices.map(s => ({
        name: s.name,
        price: s.price,
        quantity: s.quantity
      })));

      // Create order
      const orderData = {
        ...(uploadedFiles ? { files: uploadedFiles.files } : {}),
        ...(files.length > 0 ? { pages, copies, printSide } : {}),
        serviceItems,
        totalAmount,
        paymentMethod,
        message: message.trim() || undefined,
      };

      const orderRes = await fetch('/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!orderRes.ok) {
        const orderError = await orderRes.json().catch(() => null);
        throw new Error(orderError?.error || 'Failed to create order');
      }

      const order = await orderRes.json();

      if (paymentMethod === 'RAZORPAY') {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
          amount: Math.round(totalAmount * 100),
          currency: 'INR',
          name: 'Raman Prints',
          description: 'Printing Service Payment',
          order_id: order.razorpayOrderId,
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch('/api/razorpay', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: order.orderId,
                }),
              });

              if (verifyRes.ok) {
                router.push('/dashboard/history');
              } else {
                setError('Payment verification failed');
              }
            } catch (err) {
              setError('Payment verification failed');
            }
          },
          modal: {
            ondismiss: function() {
              router.push('/dashboard/history');
            }
          },
          prefill: {
            name: order.userName || userName,
            contact: userPhone,
          },
          theme: {
            color: '#4f46e5',
          },
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      } else {
        router.push('/dashboard/history');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  // Show message for unverified users
  if (isVerified === false && !loading) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
          <div className="h-20 w-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-10 w-10 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Account Not Verified</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your account needs to be verified by an admin before you can place orders. Please contact the admin for verification.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show message when service is unavailable
  if (!isServiceAvailable && !loading) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
          <div className="h-20 w-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-10 w-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Service Unavailable</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {serviceUnavailableMessage}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show loading while checking verification
  if (loading || isVerified === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all duration-300">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Create New Order</h1>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-200 px-4 py-3 rounded-lg animate-scale-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload - New UI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload Files (PDF, DOC, DOCX, Images)
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">— optional for service-only orders</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Max 10 files, 4 MB each</p>
            <div className="border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg">
              <FileUpload onChange={handleFilesChange} />
            </div>
            {files.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {files.length} file(s) selected
              </p>
            )}
          </div>

          {/* Auto Page Detection Info */}
          {countingPages && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-700 dark:text-blue-300">Detecting page count...</span>
            </div>
          )}

          {pageDetails.length > 0 && !countingPages && (
            <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm font-medium text-green-800 dark:text-green-400 mb-1">
                Auto-detected: {detectedPages} page{detectedPages > 1 ? 's' : ''}
                {printSide === 'DOUBLE' && detectedPages > 0 && (
                  <span className="text-xs ml-1">(→ {Math.ceil(detectedPages / 2)} sheets for double-sided)</span>
                )}
              </p>
              <div className="text-xs text-green-700 dark:text-green-300 space-y-0.5">
                {pageDetails.map((detail, idx) => (
                  <p key={idx}>
                    {detail.name}: {detail.pages} page{detail.pages > 1 ? 's' : ''}
                    {detail.type !== 'application/pdf' && ' (estimated)'}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Print Side - BEFORE pages */}
          <div className={`transition-all duration-300 ${!hasFiles ? 'opacity-40 pointer-events-none' : ''}`}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Print Side {!hasFiles && <span className="text-xs text-gray-400 ml-1">(upload files first)</span>}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handlePrintSideChange('SINGLE')}
                className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                  printSide === 'SINGLE'
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500'
                }`}
              >
                Single-sided
              </button>
              <button
                type="button"
                onClick={() => handlePrintSideChange('DOUBLE')}
                className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                  printSide === 'DOUBLE'
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500'
                }`}
              >
                Double-sided
              </button>
            </div>
            {printSide === 'DOUBLE' && detectedPages > 0 && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                Pages adjusted: {detectedPages} pages → {Math.ceil(detectedPages / 2)} sheets (double-sided)
              </p>
            )}
          </div>

          {/* Number of Pages */}
          <div className={`transition-all duration-300 ${!hasFiles ? 'opacity-40 pointer-events-none' : ''}`}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Number of Pages {printSide === 'DOUBLE' ? '(sheets)' : ''} {!hasFiles && <span className="text-xs text-gray-400 ml-1">(upload files first)</span>}
            </label>
            <ScrollableNumberInput
              value={pages}
              onChange={(val) => setPages(val)}
              min={hasFiles ? 1 : 0}
              max={199}
              disabled={!hasFiles}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Auto-detected from PDFs. You can adjust manually if needed.
            </p>
          </div>

          {/* Number of Copies */}
          <div className={`transition-all duration-300 ${!hasFiles ? 'opacity-40 pointer-events-none' : ''}`}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Number of Copies {!hasFiles && <span className="text-xs text-gray-400 ml-1">(upload files first)</span>}
            </label>
            <ScrollableNumberInput
              value={copies}
              onChange={(val) => setCopies(val)}
              min={1}
              max={20}
              disabled={!hasFiles}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maximum 20 copies per order</p>
          </div>

          {/* Additional Service Items */}
          {availableServices.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Services (Optional)
              </label>
              <div className="space-y-2">
                {availableServices.map((service) => {
                  const quantity = getServiceQuantity(service.name);
                  return (
                    <div
                      key={service.name}
                      className="flex items-center justify-between px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{service.name}</p>
                        <p className="text-sm text-indigo-600 dark:text-indigo-400">₹{service.price} each</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {quantity > 0 ? (
                          <>
                            <button
                              type="button"
                              onClick={() => decrementServiceItem(service.name)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 font-bold"
                            >
                              −
                            </button>
                            <span className="w-12 text-center font-semibold text-gray-900 dark:text-white">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => addServiceItem(service.name)}
                              disabled={quantity >= 20}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                            >
                              +
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addServiceItem(service.name)}
                            className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 font-medium"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedServices.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {selectedServices.reduce((sum, s) => sum + s.quantity, 0)} service item(s) selected
                </p>
              )}
            </div>
          )}

          {/* Message (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Special Instructions (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add any special instructions for your order..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Total Amount */}
          <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Total Amount:</span>
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                ₹{totalAmount}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
              {hasFiles && (
                <p>Printing: {pages} pages × {copies} copies × ₹{pricePerPage} = ₹{printingCost}</p>
              )}
              {!hasFiles && selectedServices.length > 0 && (
                <p className="text-xs text-gray-500">Service-only order (no printing)</p>
              )}
              {selectedServices.length > 0 && (
                <>
                  {selectedServices.map((s) => (
                    <p key={s.id}>
                      {s.name}: {s.quantity} × ₹{s.price} = ₹{s.quantity * s.price}
                    </p>
                  ))}
                  <p className="font-medium pt-1 border-t border-indigo-200 dark:border-indigo-700">
                    Services Total: ₹{servicesCost}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Payment Method
            </label>
            <div className={`grid ${isCodEnabled ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
              <button
                type="button"
                onClick={() => setPaymentMethod('RAZORPAY')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  paymentMethod === 'RAZORPAY'
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-500'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="font-medium">Pay Now</span>
              </button>
              {isCodEnabled && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-500'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span className="font-medium">Cash on Delivery</span>
                </button>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading || (files.length === 0 && selectedServices.length === 0)}
            className="w-full bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] shadow-lg hover:shadow-xl"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Order...
              </span>
            ) : (
              `Place Order - ₹${totalAmount}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
