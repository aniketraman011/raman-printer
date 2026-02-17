'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, ArrowLeft, FileText, Eye, Edit3, Save, X, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/constants';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Edit state
  const [editPages, setEditPages] = useState(0);
  const [editCopies, setEditCopies] = useState(0);
  const [editServiceItems, setEditServiceItems] = useState<any[]>([]);
  const [availableServices, setAvailableServices] = useState<any[]>([]);

  useEffect(() => {
    fetchOrder();
    fetchSettings();
  }, [params.id]);

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/admin/order/${params.id}`);
      const data = await res.json();
      if (data.success) {
        setOrder(data.order);
        setEditPages(data.order.pages || 1);
        setEditCopies(data.order.copies || 1);
        setEditServiceItems(data.order.serviceItems || []);
      }
    } catch (error) {
      console.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  }

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      const data = await res.json();
      setAvailableServices(data.serviceItems?.filter((s: any) => s.isActive) || []);
    } catch (err) {
      console.error('Failed to load settings');
    }
  }

  function startEditing() {
    setEditPages(order.pages || 1);
    setEditCopies(order.copies || 1);
    setEditServiceItems(JSON.parse(JSON.stringify(order.serviceItems || [])));
    setEditing(true);
    setMessage('');
  }

  function cancelEditing() {
    setEditing(false);
    setMessage('');
  }

  function updateServiceQuantity(index: number, quantity: number) {
    const updated = [...editServiceItems];
    updated[index].quantity = Math.max(1, quantity);
    setEditServiceItems(updated);
  }

  function updateServicePrice(index: number, price: number) {
    const updated = [...editServiceItems];
    updated[index].price = Math.max(0, price);
    setEditServiceItems(updated);
  }

  function removeServiceItem(index: number) {
    setEditServiceItems(editServiceItems.filter((_, i) => i !== index));
  }

  function addServiceItem(service: any) {
    const existing = editServiceItems.find(s => s.name === service.name);
    if (existing) {
      setEditServiceItems(editServiceItems.map(s =>
        s.name === service.name ? { ...s, quantity: s.quantity + 1 } : s
      ));
    } else {
      setEditServiceItems([...editServiceItems, {
        name: service.name,
        price: service.price,
        quantity: 1,
      }]);
    }
  }

  // Update B/W Printing service item when pages/copies change
  function getUpdatedServiceItems() {
    const items = [...editServiceItems];
    const bwIndex = items.findIndex(s => s.name.includes('B/W') || s.name.includes('Black & White'));
    if (bwIndex >= 0) {
      items[bwIndex].quantity = editPages * editCopies;
    }
    return items;
  }

  async function saveChanges() {
    setSaving(true);
    setMessage('');
    try {
      const updatedItems = getUpdatedServiceItems();
      const newTotal = updatedItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

      const res = await fetch(`/api/admin/order/${params.id}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pages: editPages,
          copies: editCopies,
          serviceItems: updatedItems,
          totalAmount: newTotal,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const paid = data.order?.paidAmount || 0;
        const total = data.order?.totalAmount || 0;
        const pStatus = data.order?.paymentStatus || '';
        let msg = 'Order updated successfully!';
        if (pStatus === 'PENDING' && paid > 0 && total > paid) {
          msg += ` Remaining balance: ₹${total - paid} (Payment status: PENDING)`;
        } else if (pStatus === 'PAID') {
          msg += ' Payment status: PAID.';
        } else if (pStatus === 'PENDING') {
          msg += ' Payment status set to PENDING.';
        }
        setMessage(msg);
        setEditing(false);
        fetchOrder();
      } else {
        setMessage('Failed to update: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setMessage('Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

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

  const editTotal = editing
    ? getUpdatedServiceItems().reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    : order.totalAmount;

  const addableServices = availableServices.filter(
    (s: any) => !editServiceItems.find(es => es.name === s.name)
  );

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

      {message && (
        <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${
          message.includes('success')
            ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Order Information</h2>
            {!editing ? (
              <button
                onClick={startEditing}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors font-medium"
              >
                <Edit3 className="h-4 w-4" />
                Edit Order
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={saveChanges}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={cancelEditing}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* 1. Customer Name */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Customer Name</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{order.user.fullName}</p>
            </div>

            {/* 2. Print Side */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Print Side</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {order.printSide === 'SINGLE' ? 'Single-sided' : 'Double-sided'}
              </p>
            </div>

            {/* 3 & 4. Pages & Copies - Editable */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pages</p>
                {editing ? (
                  <input
                    type="number"
                    min="1"
                    value={editPages}
                    onChange={(e) => setEditPages(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 text-xl font-bold"
                  />
                ) : (
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{order.pages ?? 'N/A'}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Copies</p>
                {editing ? (
                  <input
                    type="number"
                    min="1"
                    value={editCopies}
                    onChange={(e) => setEditCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 text-xl font-bold"
                  />
                ) : (
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{order.copies ?? 'N/A'}</p>
                )}
              </div>
            </div>

            {/* 5. Special Instructions */}
            {order.message && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Special Instructions</p>
                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <p className="text-gray-900 dark:text-gray-300">{order.message}</p>
                </div>
              </div>
            )}

            {/* 6. Service Items - Editable */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Service Items</p>
              {editing ? (
                <div className="space-y-2">
                  {editServiceItems.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 min-w-0 truncate">{item.name}</span>
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-gray-500">Qty:</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateServiceQuantity(index, parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-gray-500">₹:</label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={item.price}
                          onChange={(e) => updateServicePrice(index, parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded"
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[60px] text-right">
                        = ₹{item.quantity * item.price}
                      </span>
                      <button
                        onClick={() => removeServiceItem(index)}
                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {addableServices.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Add Service:</p>
                      <div className="flex flex-wrap gap-2">
                        {addableServices.map((service: any) => (
                          <button
                            key={service.name}
                            onClick={() => addServiceItem(service)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800"
                          >
                            <Plus className="h-3 w-3" />
                            {service.name} (₹{service.price})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">New Total:</span>
                      <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">₹{editTotal}</span>
                    </div>
                    {editTotal !== order.totalAmount && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Changed from ₹{order.totalAmount} → ₹{editTotal}.
                      </p>
                    )}
                  </div>

                  {/* Remaining balance preview when editing */}
                  {(() => {
                    // If order was PAID but paidAmount=0 (legacy/COD), treat original total as paid
                    const paid = (order.paidAmount || 0) > 0 ? order.paidAmount : (order.paymentStatus === 'PAID' ? order.totalAmount : 0);
                    if (paid > 0 && editTotal > paid) {
                      const remaining = editTotal - paid;
                      return (
                        <div className="mt-3 p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 dark:border-amber-600 rounded-lg">
                          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wide mb-2">Payment Breakdown</p>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-700 dark:text-gray-300">New Total:</span>
                            <span className="font-bold text-gray-900 dark:text-white">₹{editTotal}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm mt-1">
                            <span className="text-green-700 dark:text-green-400">Already Paid:</span>
                            <span className="font-bold text-green-700 dark:text-green-400">- ₹{paid}</span>
                          </div>
                          <div className="border-t border-amber-300 dark:border-amber-600 my-2"></div>
                          <div className="flex justify-between items-center">
                            <span className="text-red-700 dark:text-red-400 font-bold">Remaining Balance:</span>
                            <span className="text-xl font-bold text-red-700 dark:text-red-400">₹{remaining}</span>
                          </div>
                          <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                            User will need to pay ₹{remaining} via &quot;Pay Remaining Balance&quot; button.
                          </p>
                        </div>
                      );
                    } else if (paid > 0 && editTotal <= paid) {
                      return (
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
                          <p className="text-sm text-green-700 dark:text-green-400 font-semibold">
                            ✓ Already paid ₹{paid} — covers new total ₹{editTotal}. Status will be set to PAID.
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              ) : (
                <div className="space-y-2">
                  {order.serviceItems?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {item.quantity} × ₹{item.price} = ₹{item.quantity * item.price}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!editing && (
              <>
                {/* 7. Total Amount */}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Amount</p>
                  <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(order.totalAmount)}</p>
                </div>

                {/* Remaining Balance Info */}
                {order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED' && (() => {
                  // If paidAmount=0 but was PAID (legacy/COD), treat original total as paid
                  const paid = (order.paidAmount || 0) > 0 ? order.paidAmount : 0;
                  const remaining = order.totalAmount - paid;
                  return remaining > 0 ? (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-lg">
                      {paid > 0 && (
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span className="text-amber-800 dark:text-amber-300 font-medium">Already Paid:</span>
                          <span className="text-amber-900 dark:text-amber-200 font-bold">{formatCurrency(paid)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-red-700 dark:text-red-400 font-bold">Remaining Balance:</span>
                        <span className="text-red-800 dark:text-red-300 font-bold text-xl">{formatCurrency(remaining)}</span>
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">User will see a &quot;Pay Remaining Balance&quot; button for this order.</p>
                    </div>
                  ) : null;
                })()}

                {/* 8. Payment Status */}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Payment Status</p>
                  <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-semibold ${
                    order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    order.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    order.paymentStatus === 'UNPAID' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>

                {/* 9. Order Status (admin can change) */}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Order Status</p>
                  <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-semibold ${
                    order.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                    order.status === 'READY' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                    order.status === 'PRINTING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {order.status}
                  </span>
                </div>

                {/* 10. Phone Number */}
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

                {/* 11. Order Date and Time */}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Order Date & Time</p>
                  <p className="text-lg text-gray-900 dark:text-gray-300">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </>
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
