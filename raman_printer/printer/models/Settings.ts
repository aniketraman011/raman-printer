import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceItem {
  name: string;
  price: number;
  isActive: boolean;
}

export interface ISettings extends Document {
  serviceItems: IServiceItem[];
  isServiceAvailable: boolean;
  isCodEnabled: boolean;
  adminContactName: string;
  adminContactPhone: string;
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceItemSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const SettingsSchema = new Schema<ISettings>(
  {
    serviceItems: {
      type: [ServiceItemSchema],
      default: [
        { name: 'Black & White Printing', price: 2, isActive: true },
        { name: 'Color Printing', price: 5, isActive: true },
        { name: 'Spiral Binding', price: 20, isActive: true },
        { name: 'Lamination (per page)', price: 10, isActive: true },
      ],
    },
    isServiceAvailable: {
      type: Boolean,
      default: true,
    },
    isCodEnabled: {
      type: Boolean,
      default: true,
    },
    adminContactName: {
      type: String,
      default: 'Raman Prints',
      trim: true,
    },
    adminContactPhone: {
      type: String,
      default: '+91 98765 43210',
      trim: true,
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: [0, 'Revenue cannot be negative'],
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: [0, 'Total orders cannot be negative'],
    },
    completedOrders: {
      type: Number,
      default: 0,
      min: [0, 'Completed orders cannot be negative'],
    },
    cancelledOrders: {
      type: Number,
      default: 0,
      min: [0, 'Cancelled orders cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

const Settings = (mongoose.models && mongoose.models.Settings) || mongoose.model<ISettings>('Settings', SettingsSchema);
export default Settings as mongoose.Model<ISettings>;
