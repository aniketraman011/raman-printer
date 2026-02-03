'use client';

import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Plus, Trash2, Save, DollarSign, Power } from 'lucide-react';
import { getSettings, updateSettings, addServiceItem, updateServiceItem, deleteServiceItem } from '@/app/actions/settings';

interface ServiceItem {
  name: string;
  price: number;
  isActive: boolean;
}

interface Settings {
  serviceItems: ServiceItem[];
  isServiceAvailable: boolean;
  isCodEnabled: boolean;
  adminContactName: string;
  adminContactPhone: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newService, setNewService] = useState({ name: '', price: '' });
  const [adminContact, setAdminContact] = useState({ name: '', phone: '' });
  const [basePrintingPrice, setBasePrintingPrice] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
      setAdminContact({
        name: data.adminContactName || 'Raman Prints',
        phone: data.adminContactPhone || '+91 98765 43210',
      });
      
      // Find Black & White Printing price
      const bwPrinting = data.serviceItems.find((item: any) => item.name.includes('Black & White'));
      setBasePrintingPrice(bwPrinting?.price?.toString() || '2');
    } catch (error) {
      console.error('Load settings error:', error);
      setMessage('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleServiceAvailability = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      const updated = await updateSettings({
        isServiceAvailable: !settings.isServiceAvailable,
      });
      setSettings(updated);
      setMessage('Service availability updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to update service availability');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCod = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      const updated = await updateSettings({
        isCodEnabled: !settings.isCodEnabled,
      });
      setSettings(updated);
      setMessage('COD setting updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to update COD setting');
    } finally {
      setSaving(false);
    }
  };

  const handleAddService = async () => {
    if (!newService.name || !newService.price) {
      setMessage('Please enter service name and price');
      return;
    }

    try {
      setSaving(true);
      const updated = await addServiceItem(newService.name, parseFloat(newService.price));
      setSettings(updated);
      setNewService({ name: '', price: '' });
      setMessage('Service added successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to add service');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateService = async (index: number, data: Partial<ServiceItem>) => {
    try {
      setSaving(true);
      const updated = await updateServiceItem(index, data);
      setSettings(updated);
      setMessage('Service updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Update service error:', error);
      setMessage('Failed to update service');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (index: number) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      setSaving(true);
      const updated = await deleteServiceItem(index);
      setSettings(updated);
      setMessage('Service deleted successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to delete service');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAdminContact = async () => {
    if (!adminContact.name || !adminContact.phone) {
      setMessage('Please enter both name and phone');
      return;
    }

    try {
      setSaving(true);
      const updated = await updateSettings({
        adminContactName: adminContact.name,
        adminContactPhone: adminContact.phone,
      });
      setSettings(updated);
      setMessage('Contact info updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to update contact info');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBasePrintingPrice = async () => {
    console.log('Update Price button clicked!', { basePrintingPrice, settings });
    
    const price = parseFloat(basePrintingPrice);
    if (!basePrintingPrice || isNaN(price) || price < 0) {
      setMessage('❌ Please enter a valid price');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      setSaving(true);
      setMessage(''); // Clear any previous messages
      
      console.log('Finding Black & White Printing service...');
      // Find the Black & White Printing service item index
      const bwIndex = settings?.serviceItems.findIndex(item => item.name.includes('Black & White'));
      console.log('Found index:', bwIndex);
      
      if (bwIndex !== undefined && bwIndex >= 0) {
        console.log('Updating service item at index', bwIndex, 'with price', price);
        const updated = await updateServiceItem(bwIndex, { price });
        console.log('Update successful, new settings:', updated);
        
        setSettings(updated);
        
        // Also update the base printing price state to reflect the change
        const updatedBwPrice = updated.serviceItems.find((item: any) => item.name.includes('Black & White'))?.price;
        if (updatedBwPrice !== undefined) {
          setBasePrintingPrice(updatedBwPrice.toString());
        }
        
        setMessage('✅ Base printing price updated successfully! Changes will reflect on homepage and user dashboard.');
        setTimeout(() => setMessage(''), 5000);
      } else {
        console.error('Black & White service not found in items:', settings?.serviceItems);
        setMessage('❌ Black & White Printing service not found. Please add it in Service Items section below.');
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      console.error('Update base price error:', error);
      setMessage('❌ Failed to update base printing price. Error: ' + (error as Error).message);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-red-600">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Manage services, pricing, and availability</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border-2 font-medium ${
            message.includes('✅') || message.includes('success') 
              ? 'bg-green-50 border-green-300 text-green-800' 
              : message.includes('❌') || message.includes('Failed') || message.includes('not found')
              ? 'bg-red-50 border-red-300 text-red-800'
              : 'bg-blue-50 border-blue-300 text-blue-800'
          }`}>
            {message}
          </div>
        )}

        {/* Service Availability Toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Power className="h-5 w-5" />
                Service Availability
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Control whether customers can place new orders
              </p>
            </div>
            <button
              onClick={handleToggleServiceAvailability}
              disabled={saving}
              className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors ${
                settings.isServiceAvailable ? 'bg-green-500' : 'bg-gray-300'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-10 w-10 transform rounded-full bg-white transition-transform ${
                  settings.isServiceAvailable ? 'translate-x-12' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="mt-4">
            <span
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                settings.isServiceAvailable
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {settings.isServiceAvailable ? '✓ Service Available' : '✗ Service Unavailable'}
            </span>
          </div>
        </div>

        {/* COD Toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cash on Delivery (COD)
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Allow customers to pay on delivery
              </p>
            </div>
            <button
              onClick={handleToggleCod}
              disabled={saving}
              className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors ${
                settings.isCodEnabled ? 'bg-green-500' : 'bg-gray-300'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-10 w-10 transform rounded-full bg-white transition-transform ${
                  settings.isCodEnabled ? 'translate-x-12' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="mt-4">
            <span
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                settings.isCodEnabled
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {settings.isCodEnabled ? '✓ COD Enabled' : '✗ COD Disabled'}
            </span>
          </div>
        </div>

        {/* Base Printing Price - Quick Access */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-lg shadow-sm p-6 mb-6 border-2 border-indigo-200 dark:border-indigo-800">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Base Printing Price (Per Page)
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Set the price per page for Black & White printing - shown in order calculations
            </p>
          </div>

          <div className="flex items-end gap-4">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price per Page (₹)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 font-bold text-2xl">₹</span>
                </div>
                <input
                  type="number"
                  value={basePrintingPrice}
                  onChange={(e) => setBasePrintingPrice(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-2xl font-bold border-2 border-indigo-300 dark:border-indigo-700 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="2"
                  min="0"
                  step="0.5"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This price is used in "pages × copies × ₹X/page" calculations</p>
            </div>
            
            <button
              type="button"
              onClick={handleUpdateBasePrintingPrice}
              disabled={saving}
              className="bg-indigo-600 dark:bg-indigo-500 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-semibold"
            >
              <Save className="h-5 w-5" />
              {saving ? 'Updating...' : 'Update Price'}
            </button>
          </div>
        </div>

        {/* Admin Contact Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Admin Contact Information</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This information will be displayed to customers on the homepage
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                value={adminContact.name}
                onChange={(e) => setAdminContact({ ...adminContact, name: e.target.value })}
                placeholder="e.g., Raman Prints"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="text"
                value={adminContact.phone}
                onChange={(e) => setAdminContact({ ...adminContact, phone: e.target.value })}
                placeholder="e.g., +91 98765 43210"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={handleUpdateAdminContact}
            disabled={saving}
            className="bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Contact Info
          </button>
        </div>

        {/* Service Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Service Items & Pricing</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Edit service names and prices (₹ per page or per item)</p>
          </div>

          {/* Service List */}
          <div className="space-y-4 mb-6">
            {settings.serviceItems.map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Service Name</label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleUpdateService(index, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-lg"
                    placeholder="e.g., Black & White Printing"
                  />
                </div>
                <div className="w-44">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Price per Page/Item</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400 font-semibold text-lg">₹</span>
                    </div>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => {
                        const newItems = [...settings.serviceItems];
                        newItems[index] = { ...newItems[index], price: parseFloat(e.target.value) || 0 };
                        setSettings({ ...settings, serviceItems: newItems });
                      }}
                      onBlur={(e) => handleUpdateService(index, { price: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-lg font-semibold"
                      placeholder="0"
                      min="0"
                      step="1"
                    />
                  </div>
                </div>
                <div className="w-28">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Status</label>
                  <button
                    onClick={() => handleUpdateService(index, { isActive: !item.isActive })}
                    className={`w-full px-4 py-2 rounded-lg font-medium ${
                      item.isActive
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    } transition-colors`}
                  >
                    {item.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
                <div>
                  <label className="block text-xs text-transparent mb-1">Delete</label>
                  <button
                    onClick={() => handleDeleteService(index)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    disabled={saving}
                    title="Delete service"
                  >
                    <Trash2 className="h-6 w-6" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Service */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Service</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="Service name (e.g., Color Printing)"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-lg"
                />
              </div>
              <div className="w-44 relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 font-semibold text-lg">₹</span>
                </div>
                <input
                  type="number"
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                  placeholder="Price per page"
                  min="0"
                  step="1"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-lg font-semibold"
                />
              </div>
              <button
                onClick={handleAddService}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-5 w-5" />
                Add Service
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
