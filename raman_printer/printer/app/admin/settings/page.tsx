'use client';

import { useState, useEffect } from 'react';
import { Save, Printer, CreditCard, Store, Smartphone, Plus, Trash2, MonitorCheck, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSettings, updateSettings, addServiceItem as addService, updateServiceItem, deleteServiceItem as deleteService } from '@/app/actions/settings';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [newService, setNewService] = useState({ name: '', price: '' });
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [autoPrinterName, setAutoPrinterName] = useState('HP Ink Tank 310 series');
  const [autoPrintDelaySeconds, setAutoPrintDelaySeconds] = useState(10);
  const [globalMessage, setGlobalMessage] = useState('');
  const [serviceUnavailableMessage, setServiceUnavailableMessage] = useState('');
  
  // Track local edits for prices before saving
  const [localServices, setLocalServices] = useState<any[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
      setLocalServices(data.serviceItems || []);
      setWhatsappNumber(data.adminContactPhone || '');
      setAutoPrinterName(data.autoPrinterName || 'HP Ink Tank 310 series');
      setAutoPrintDelaySeconds(data.autoPrintDelaySeconds || 10);
      setGlobalMessage(data.globalMessage || '');
      setServiceUnavailableMessage(data.serviceUnavailableMessage || 'Our printing service is temporarily unavailable.');
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: string, value: boolean) => {
    try {
      const updated = await updateSettings({ [key]: value });
      setSettings(updated);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const handleUpdateContact = async () => {
    try {
      if (!whatsappNumber.trim()) {
        toast.error('Number cannot be empty');
        return;
      }
      const updated = await updateSettings({ adminContactPhone: whatsappNumber });
      setSettings(updated);
      toast.success('Support contact updated');
    } catch (error) {
      toast.error('Failed to update contact');
    }
  };

  const handleUpdatePrinterName = async () => {
    try {
      if (!autoPrinterName.trim()) {
        toast.error('Printer name cannot be empty');
        return;
      }
      const updated = await updateSettings({ autoPrinterName });
      setSettings(updated);
      toast.success('Auto-Printer name updated');
    } catch (error) {
      toast.error('Failed to update printer');
    }
  };

  const handleUpdateDelay = async () => {
    try {
      if (autoPrintDelaySeconds < 0) return;
      const updated = await updateSettings({ autoPrintDelaySeconds });
      setSettings(updated);
      toast.success('Auto-print delay updated');
    } catch (error) {
      toast.error('Failed to update delay');
    }
  };

  const handleUpdateGlobalMessage = async () => {
    try {
      const updated = await updateSettings({ globalMessage });
      setSettings(updated);
      toast.success('Global message updated');
    } catch (error) {
      toast.error('Failed to update global message');
    }
  };

  const handleUpdateServiceMessage = async () => {
    try {
      const updated = await updateSettings({ serviceUnavailableMessage });
      setSettings(updated);
      toast.success('Service availability message updated');
    } catch (error) {
      toast.error('Failed to update message');
    }
  };

  const handleAddService = async () => {
    if (!newService.name.trim() || !newService.price) {
      toast.error('Please provide name and price');
      return;
    }
    const price = parseFloat(newService.price);
    if (isNaN(price) || price < 0) {
      toast.error('Invalid price');
      return;
    }

    try {
      const updated = await addService(newService.name, price);
      setSettings(updated);
      setLocalServices(updated.serviceItems || []);
      setNewService({ name: '', price: '' });
      toast.success('Service added successfully');
    } catch (error) {
      toast.error('Failed to add service');
    }
  };

  const handleLocalPriceChange = (index: number, val: string) => {
    const arr = [...localServices];
    arr[index].price = parseFloat(val) || 0;
    setLocalServices(arr);
  };

  const handleSaveService = async (index: number) => {
    try {
      const s = localServices[index];
      const updated = await updateServiceItem(index, { price: s.price, isActive: s.isActive });
      setSettings(updated);
      toast.success('Price saved successfully');
    } catch(err) {
      toast.error('Failed to save service');
    }
  };

  const handleToggleService = async (index: number) => {
    try {
      const s = localServices[index];
      const newState = !s.isActive;
      // Update locally immediately for UX, then sync
      const arr = [...localServices];
      arr[index].isActive = newState;
      setLocalServices(arr);
      
      const updated = await updateServiceItem(index, { isActive: newState });
      setSettings(updated);
      toast.success(newState ? 'Service activated' : 'Service deactivated');
    } catch(err) {
      toast.error('Failed to toggle service');
      loadSettings(); // revert
    }
  };

  const handleDeleteService = async (index: number) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      const updated = await deleteService(index);
      setSettings(updated);
      setLocalServices(updated.serviceItems || []);
      toast.success('Service deleted');
    } catch(err) {
      toast.error('Failed to delete service');
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Platform Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage business rules, pricing, and system configurations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Toggles */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Store className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Store Status</h2>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Accepting Orders</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Turn off to temporarily stop new orders</p>
              </div>
              <button
                onClick={() => handleToggle('isServiceAvailable', !settings.isServiceAvailable)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  settings.isServiceAvailable ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  settings.isServiceAvailable ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Service Unavailable Message */}
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Service Unavailable Message
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                This message will be displayed to users when service is unavailable
              </p>
              <textarea
                value={serviceUnavailableMessage}
                onChange={(e) => setServiceUnavailableMessage(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none mb-3"
              />
              <button
                onClick={handleUpdateServiceMessage}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800/60 rounded-lg font-medium transition-colors"
              >
                <Save className="h-4 w-4" />
                Save Message
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Global Message for Users</h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This message will be displayed to all users on their dashboard homepage. Leave empty to hide.
              </p>
              
              <div className="space-y-3">
                <textarea
                  value={globalMessage}
                  onChange={(e) => setGlobalMessage(e.target.value)}
                  placeholder="e.g., Due to high demand, orders may take 24-48 hours. Thank you for your patience!"
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <button
                  onClick={handleUpdateGlobalMessage}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 font-medium transition-colors cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  Save Global Message
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <MonitorCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Auto-Printing Engine</h2>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Enable Auto-Print</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5 flex-wrap">
                  Automatically send orders to local printer after 
                  <input 
                    type="number"
                    min={0}
                    value={autoPrintDelaySeconds}
                    onChange={(e) => setAutoPrintDelaySeconds(parseInt(e.target.value) || 0)}
                    className="w-16 px-1 py-0.5 text-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                  />
                  seconds
                  <button 
                    onClick={handleUpdateDelay}
                    className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800 ml-1 font-medium transition-colors cursor-pointer"
                  >
                    Set
                  </button>
                </div>
              </div>
              <button
                onClick={() => handleToggle('isAutoPrintEnabled', !settings.isAutoPrintEnabled)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  settings.isAutoPrintEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  settings.isAutoPrintEnabled ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Connected Printer Name
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Must exactly match the system printer name (e.g. "HP Ink Tank 310 series")</p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  value={autoPrinterName}
                  onChange={(e) => setAutoPrinterName(e.target.value)}
                  placeholder="HP Ink Tank 310 series"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleUpdatePrinterName}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 font-medium whitespace-nowrap"
                >
                  <Save className="h-4 w-4" />
                  Save Name
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Printer className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pricing & Services</h2>
            </div>

            <div className="space-y-4">
              {localServices.map((service, index) => (
                <div key={index} className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex-1 min-w-[120px]">
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{service.name}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">₹</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={service.price}
                      onChange={(e) => handleLocalPriceChange(index, e.target.value)}
                      className="w-20 px-2 py-1 text-sm bg-white dark:bg-gray-800 border-gray-300 border dark:border-gray-600 rounded"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => handleSaveService(index)}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 p-1"
                      title="Save Price"
                    >
                      <Save className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleToggleService(index)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold ${
                        service.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {service.isActive ? 'Active' : 'Inactive'}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteService(index)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50"
                      disabled={service.name.includes('B/W Printing') || service.name.includes('Black & White')}
                      title={service.name.includes('Black') ? "Cannot delete core service" : "Delete"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add new service */}
              <div className="mt-6 flex flex-col sm:flex-row gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="New service name (e.g. Laminating)"
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-2 w-full sm:w-auto">
                  <input
                    type="number"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                    placeholder="Price"
                    className="w-24 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleAddService}
                    className="flex items-center gap-1 px-4 py-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800/50 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4" /> Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment Options</h2>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Cash on Delivery (COD)</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Allow students to pay upon picking up prints</p>
              </div>
              <button
                onClick={() => handleToggle('isCodEnabled', !settings.isCodEnabled)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  settings.isCodEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  settings.isCodEnabled ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
            
            <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
              <h3 className="font-semibold text-indigo-900 dark:text-indigo-300">Online Payments</h3>
              <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">Online payments via Razorpay are actively integrated and handled automatically at checkout.</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Smartphone className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Customer Support</h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                This number is used for WhatsApp integration. Customers can contact support from the checkout and layout pages. Include country code (e.g., +91).
              </p>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleUpdateContact}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 font-medium whitespace-nowrap"
                >
                  <Save className="h-4 w-4" />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
