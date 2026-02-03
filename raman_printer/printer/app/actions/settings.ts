'use server';

import connectDB from '@/lib/db';
import Settings from '@/models/Settings';

export async function getSettings() {
  try {
    await connectDB();
    
    let settings = await Settings.findOne();
    
    // Create default settings if none exist
    if (!settings) {
      settings = await Settings.create({
        serviceItems: [
          { name: 'Black & White Printing', price: 2, isActive: true },
          { name: 'Color Printing', price: 5, isActive: true },
          { name: 'Spiral Binding', price: 20, isActive: true },
          { name: 'Lamination (per page)', price: 10, isActive: true },
        ],
        isServiceAvailable: true,
        isCodEnabled: true,
        totalRevenue: 0,
        totalOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
      });
    }
    
    return JSON.parse(JSON.stringify(settings));
  } catch (error) {
    console.error('Get settings error:', error);
    // Return default settings instead of throwing
    return {
      serviceItems: [
        { name: 'Black & White Printing', price: 2, isActive: true },
        { name: 'Color Printing', price: 5, isActive: true },
        { name: 'Spiral Binding', price: 20, isActive: true },
        { name: 'Lamination (per page)', price: 10, isActive: true },
      ],
      isServiceAvailable: true,
      isCodEnabled: true,
      adminContactName: 'Raman Prints',
      adminContactPhone: '+91 98765 43210',
      totalRevenue: 0,
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
    };
  }
}

export async function updateSettings(data: {
  serviceItems?: Array<{ name: string; price: number; isActive: boolean }>;
  isServiceAvailable?: boolean;
  isCodEnabled?: boolean;
  adminContactName?: string;
  adminContactPhone?: string;
}) {
  try {
    await connectDB();
    
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create(data);
    } else {
      Object.assign(settings, data);
      await settings.save();
    }
    
    return JSON.parse(JSON.stringify(settings));
  } catch (error) {
    console.error('Update settings error:', error);
    throw new Error('Failed to update settings');
  }
}

export async function addServiceItem(name: string, price: number) {
  try {
    await connectDB();
    
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({
        serviceItems: [{ name, price, isActive: true }],
      });
    } else {
      settings.serviceItems.push({ name, price, isActive: true });
      await settings.save();
    }
    
    return JSON.parse(JSON.stringify(settings));
  } catch (error) {
    console.error('Add service item error:', error);
    throw new Error('Failed to add service item');
  }
}

export async function updateServiceItem(index: number, data: { name?: string; price?: number; isActive?: boolean }) {
  try {
    await connectDB();
    
    const settings = await Settings.findOne();
    
    if (!settings || !settings.serviceItems[index]) {
      throw new Error('Service item not found');
    }
    
    // Update the specific fields
    if (data.name !== undefined) {
      settings.serviceItems[index].name = data.name;
    }
    if (data.price !== undefined) {
      settings.serviceItems[index].price = data.price;
    }
    if (data.isActive !== undefined) {
      settings.serviceItems[index].isActive = data.isActive;
    }
    
    // Mark the array as modified for Mongoose
    settings.markModified('serviceItems');
    await settings.save();
    
    return JSON.parse(JSON.stringify(settings));
  } catch (error) {
    console.error('Update service item error:', error);
    throw new Error('Failed to update service item');
  }
}

export async function deleteServiceItem(index: number) {
  try {
    await connectDB();
    
    const settings = await Settings.findOne();
    
    if (!settings) {
      throw new Error('Settings not found');
    }
    
    settings.serviceItems.splice(index, 1);
    await settings.save();
    
    return JSON.parse(JSON.stringify(settings));
  } catch (error) {
    console.error('Delete service item error:', error);
    throw new Error('Failed to delete service item');
  }
}
