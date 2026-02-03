'use server';

import { auth } from '@/auth';
import connectDB from '@/lib/db';
import Settings from '@/models/Settings';

// Helper function to check if user is admin
async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  if (session.user.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }
  return session;
}

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
      adminContactPhone: '+91 00000 00000',
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
    // Require admin authentication
    await requireAdmin();
    
    await connectDB();
    
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create(data);
    } else {
      Object.assign(settings, data);
      await settings.save();
    }
    
    return JSON.parse(JSON.stringify(settings));
  } catch (error: any) {
    console.error('Update settings error:', error);
    throw new Error(error.message || 'Failed to update settings');
  }
}

export async function addServiceItem(name: string, price: number) {
  try {
    // Require admin authentication
    await requireAdmin();
    
    // Validate inputs
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Service name is required');
    }
    if (typeof price !== 'number' || price < 0) {
      throw new Error('Valid price is required');
    }
    
    await connectDB();
    
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({
        serviceItems: [{ name: name.trim(), price, isActive: true }],
      });
    } else {
      settings.serviceItems.push({ name: name.trim(), price, isActive: true });
      await settings.save();
    }
    
    return JSON.parse(JSON.stringify(settings));
  } catch (error: any) {
    console.error('Add service item error:', error);
    throw new Error(error.message || 'Failed to add service item');
  }
}

export async function updateServiceItem(index: number, data: { name?: string; price?: number; isActive?: boolean }) {
  try {
    // Require admin authentication
    await requireAdmin();
    
    // Validate index
    if (typeof index !== 'number' || index < 0) {
      throw new Error('Invalid service index');
    }
    
    await connectDB();
    
    const settings = await Settings.findOne();
    
    if (!settings || !settings.serviceItems[index]) {
      throw new Error('Service item not found');
    }
    
    // Update the specific fields with validation
    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim().length === 0) {
        throw new Error('Invalid service name');
      }
      settings.serviceItems[index].name = data.name.trim();
    }
    if (data.price !== undefined) {
      if (typeof data.price !== 'number' || data.price < 0) {
        throw new Error('Invalid price');
      }
      settings.serviceItems[index].price = data.price;
    }
    if (data.isActive !== undefined) {
      settings.serviceItems[index].isActive = Boolean(data.isActive);
    }
    
    // Mark the array as modified for Mongoose
    settings.markModified('serviceItems');
    await settings.save();
    
    return JSON.parse(JSON.stringify(settings));
  } catch (error: any) {
    console.error('Update service item error:', error);
    throw new Error(error.message || 'Failed to update service item');
  }
}

export async function deleteServiceItem(index: number) {
  try {
    // Require admin authentication
    await requireAdmin();
    
    // Validate index
    if (typeof index !== 'number' || index < 0) {
      throw new Error('Invalid service index');
    }
    
    await connectDB();
    
    const settings = await Settings.findOne();
    
    if (!settings) {
      throw new Error('Settings not found');
    }
    
    if (!settings.serviceItems[index]) {
      throw new Error('Service item not found');
    }
    
    settings.serviceItems.splice(index, 1);
    await settings.save();
    
    return JSON.parse(JSON.stringify(settings));
  } catch (error: any) {
    console.error('Delete service item error:', error);
    throw new Error(error.message || 'Failed to delete service item');
  }
}
