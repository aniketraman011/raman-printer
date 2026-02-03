import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderFile {
  fileName: string;
  fileUrl: string;
  fileSize: number;
}

export interface IServiceItem {
  name: string;
  price: number;
  quantity: number;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  files: IOrderFile[];
  serviceItems: IServiceItem[];
  totalAmount: number;
  paymentMethod: 'RAZORPAY' | 'COD';
  status: 'PENDING' | 'PRINTING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'UNPAID' | 'FAILED';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  cancelRequested?: boolean;
  cancelRequestedAt?: Date;
  cancelApprovedByAdmin?: boolean;
  printSide: 'SINGLE' | 'DOUBLE';
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    files: [{
      fileName: {
        type: String,
        required: [true, 'File name is required'],
      },
      fileUrl: {
        type: String,
        required: [true, 'File URL is required'],
      },
      fileSize: {
        type: Number,
        required: [true, 'File size is required'],
      },
    }],
    serviceItems: [{
      name: {
        type: String,
        required: [true, 'Service name is required'],
      },
      price: {
        type: Number,
        required: [true, 'Service price is required'],
      },
      quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
      },
    }],
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
    },
    paymentMethod: {
      type: String,
      enum: ['RAZORPAY', 'COD'],
      required: [true, 'Payment method is required'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'PRINTING', 'READY', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'UNPAID', 'FAILED'],
      default: 'PENDING',
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    cancelRequested: {
      type: Boolean,
      default: false,
    },
    cancelRequestedAt: {
      type: Date,
    },
    cancelApprovedByAdmin: {
      type: Boolean,
      default: false,
    },
    printSide: {
      type: String,
      enum: ['SINGLE', 'DOUBLE'],
      default: 'SINGLE',
      required: true,
    },
    message: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Delete the model from cache if it exists to ensure fresh schema
if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

const Order = mongoose.model<IOrder>('Order', OrderSchema);
export default Order as mongoose.Model<IOrder>;
