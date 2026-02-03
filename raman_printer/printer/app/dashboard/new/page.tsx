'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, CreditCard, Banknote } from 'lucide-react';

export default function NewOrderPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState<number>(1);
  const [copies, setCopies] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD'>('RAZORPAY');
  const [printSide, setPrintSide] = useState<'SINGLE' | 'DOUBLE'>('SINGLE');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isCodEnabled, setIsCodEnabled] = useState(true);
  const [pricePerPage, setPricePerPage] = useState(2);
  const [loading, setLoading] = useState(true);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<{id: string; name: string; price: number; quantity: number}[]>([]);

  const printingCost = pages * copies * pricePerPage;
  const servicesCost = selectedServices.reduce((sum, s) => sum + (s.price * s.quantity), 0);
  const totalAmount = printingCost + servicesCost;

  useEffect(() => {
    // Fetch settings to check if COD is enabled and get current price
    fetch('/api/settings', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    })
      .then(res => res.json())
      .then(data => {
        console.log('Settings fetched:', data);
        setIsCodEnabled(data.isCodEnabled);
        // Get the current Black & White printing price
        const bwPrice = data.serviceItems?.find((item: any) => item.name.includes('Black & White'))?.price || 2;
        console.log('Black & White price found:', bwPrice);
        setPricePerPage(bwPrice);
        // Store available service items (excluding B&W Printing)
        const otherServices = data.serviceItems?.filter((item: any) => !item.name.includes('Black & White')) || [];
        setAvailableServices(otherServices);
        // If COD is disabled and currently selected, switch to RAZORPAY
        if (!data.isCodEnabled && paymentMethod === 'COD') {
          setPaymentMethod('RAZORPAY');
        }
      })
      .catch(err => console.error('Failed to load settings:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      // Validate maximum number of files
      if (selectedFiles.length > 10) {
        setError('Maximum 10 files allowed per upload');
        e.target.value = '';
        return;
      }
      
      // Validate total size
      const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
      const maxTotalSize = 100 * 1024 * 1024; // 100MB
      if (totalSize > maxTotalSize) {
        setError('Total file size exceeds 100MB limit');
        e.target.value = '';
        return;
      }
      
      // Validate individual file sizes
      const maxFileSize = 20 * 1024 * 1024; // 20MB
      const oversizedFile = selectedFiles.find(file => file.size > maxFileSize);
      if (oversizedFile) {
        setError(`File too large: ${oversizedFile.name}. Maximum size per file is 20MB`);
        e.target.value = '';
        return;
      }
      
      setFiles(selectedFiles);
      setError('');
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const addServiceItem = (serviceName: string) => {
    const existing = selectedServices.find(s => s.name === serviceName);
    if (existing) {
      // Increment quantity if already exists
      setSelectedServices(selectedServices.map(s => 
        s.name === serviceName ? {...s, quantity: s.quantity + 1} : s
      ));
    } else {
      // Add new service with quantity 1
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
        // Remove if quantity becomes 0
        setSelectedServices(selectedServices.filter(s => s.name !== serviceName));
      }
    }
  };

  const getServiceQuantity = (serviceName: string): number => {
    return selectedServices.find(s => s.name === serviceName)?.quantity || 0;
  };

  const removeServiceItem = (id: string) => {
    setSelectedServices(selectedServices.filter(s => s.id !== id));
  };

  const updateServiceQuantity = (id: string, quantity: number) => {
    setSelectedServices(selectedServices.map(s => 
      s.id === id ? {...s, quantity: Math.max(1, quantity)} : s
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (files.length === 0) {
      setError('Please upload at least one file');
      return;
    }

    if (pages < 1) {
      setError('Please enter valid number of pages');
      return;
    }

    if (pages > 100) {
      setError('Maximum 100 pages allowed per order');
      return;
    }

    if (copies < 1) {
      setError('Please enter valid number of copies');
      return;
    }

    if (copies > 20) {
      setError('Maximum 20 copies allowed per order');
      return;
    }

    try {
      setUploading(true);

      // Upload files
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload files');
      }

      const uploadedFiles = await uploadRes.json();

      // Create order
      const orderData = {
        files: uploadedFiles.files,
        serviceItems: [
          {
            name: 'B/W Printing',
            price: pricePerPage,
            quantity: pages * copies,
          },
          ...selectedServices.map(s => ({
            name: s.name,
            price: s.price,
            quantity: s.quantity
          }))
        ],
        totalAmount: pages * copies * pricePerPage + selectedServices.reduce((sum, s) => sum + (s.price * s.quantity), 0),
        paymentMethod,
        printSide,
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
        throw new Error('Failed to create order');
      }

      const order = await orderRes.json();

      if (paymentMethod === 'RAZORPAY') {
        // Initialize Razorpay payment
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
          amount: totalAmount * 100,
          currency: 'INR',
          name: 'Raman Prints',
          description: 'Printing Service Payment',
          order_id: order.razorpayOrderId,
          handler: async function (response: any) {
            try {
              // Payment successful - verify and update order
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
                // Payment verified successfully
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
              // Order is already placed, redirect to history
              // User can complete payment later
              router.push('/dashboard/history');
            }
          },
          prefill: {
            name: order.userName,
          },
          theme: {
            color: '#4f46e5',
          },
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      } else {
        // COD order created - redirect directly
        router.push('/dashboard/history');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

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
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Upload className="inline w-4 h-4 mr-1" />
              Upload Files (PDF, DOC, DOCX, Images)
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Maximum 10 files, 100MB total (20MB per file)
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-400
                hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50"
            />
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({(file.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Number of Pages */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Number of Pages
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="100"
                value={pages}
                onChange={(e) => setPages(e.target.value === '' ? 0 : parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Maximum 100 pages per order
            </p>
          </div>

          {/* Number of Copies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Number of Copies
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={copies}
              onChange={(e) => setCopies(e.target.value === '' ? 0 : parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maximum 20 copies per order</p>
          </div>

          {/* Print Side */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Print Side
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPrintSide('SINGLE')}
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
                onClick={() => setPrintSide('DOUBLE')}
                className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                  printSide === 'DOUBLE'
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500'
                }`}
              >
                Double-sided
              </button>
            </div>
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
              <p>Printing: {pages} pages × {copies} copies × ₹{pricePerPage} = ₹{printingCost}</p>
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
            disabled={uploading || files.length === 0}
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
