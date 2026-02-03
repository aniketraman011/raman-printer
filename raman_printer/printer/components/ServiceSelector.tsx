'use client';

import { useEffect, useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { getSettings } from '@/app/actions/settings';

interface ServiceItem {
  name: string;
  price: number;
  isActive: boolean;
}

interface SelectedService extends ServiceItem {
  quantity: number;
}

interface ServiceSelectorProps {
  onTotalChange: (total: number, services: Array<{ name: string; price: number; quantity: number }>) => void;
}

export default function ServiceSelector({ onTotalChange }: ServiceSelectorProps) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedServices, setSelectedServices] = useState<Map<string, SelectedService>>(new Map());
  const [loading, setLoading] = useState(true);
  const [serviceAvailable, setServiceAvailable] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [selectedServices]);

  const loadServices = async () => {
    try {
      const settings = await getSettings();
      setServices(settings.serviceItems.filter((item: ServiceItem) => item.isActive));
      setServiceAvailable(settings.isServiceAvailable);
    } catch (error) {
      console.error('Load services error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    let total = 0;
    const serviceArray: Array<{ name: string; price: number; quantity: number }> = [];
    
    selectedServices.forEach((service) => {
      total += service.price * service.quantity;
      serviceArray.push({
        name: service.name,
        price: service.price,
        quantity: service.quantity,
      });
    });
    
    onTotalChange(total, serviceArray);
  };

  const updateQuantity = (service: ServiceItem, change: number) => {
    const newSelected = new Map(selectedServices);
    const current = newSelected.get(service.name);
    
    if (current) {
      const newQuantity = current.quantity + change;
      if (newQuantity <= 0) {
        newSelected.delete(service.name);
      } else {
        newSelected.set(service.name, { ...service, quantity: newQuantity });
      }
    } else if (change > 0) {
      newSelected.set(service.name, { ...service, quantity: 1 });
    }
    
    setSelectedServices(newSelected);
  };

  const setQuantity = (service: ServiceItem, value: string) => {
    const quantity = parseInt(value) || 0;
    const newSelected = new Map(selectedServices);
    
    if (quantity <= 0) {
      newSelected.delete(service.name);
    } else {
      newSelected.set(service.name, { ...service, quantity });
    }
    
    setSelectedServices(newSelected);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-gray-600 text-center">Loading services...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Service Availability Banner */}
      {!serviceAvailable && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 font-medium">⚠️ Service Currently Unavailable</p>
          <p className="text-yellow-700 text-sm mt-1">
            You can still place an order, but processing may be delayed.
          </p>
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Services</h3>

      {/* Service Grid */}
      <div className="grid gap-4 mb-6">
        {services.map((service) => {
          const selected = selectedServices.get(service.name);
          const quantity = selected?.quantity || 0;

          return (
            <div
              key={service.name}
              className={`p-4 border rounded-lg transition-all ${
                quantity > 0
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{service.name}</h4>
                  <p className="text-indigo-600 font-semibold mt-1">
                    ₹{service.price.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(service, -1)}
                    disabled={quantity === 0}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="h-4 w-4 text-gray-600" />
                  </button>

                  <input
                    type="number"
                    min="0"
                    value={quantity || ''}
                    onChange={(e) => setQuantity(service, e.target.value)}
                    className="w-16 text-center border border-gray-300 rounded-lg py-2 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="0"
                  />

                  <button
                    onClick={() => updateQuantity(service, 1)}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {quantity > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold text-gray-900">
                      ₹{(service.price * quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {selectedServices.size > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <div className="space-y-2">
            {Array.from(selectedServices.values()).map((service) => (
              <div key={service.name} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {service.name} × {service.quantity}
                </span>
                <span className="font-medium text-gray-900">
                  ₹{(service.price * service.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
