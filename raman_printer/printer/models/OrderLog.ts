import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderLog extends Document {
  orderId: mongoose.Types.ObjectId;
  totalAmount: number;
  createdAt: Date;
}

const OrderLogSchema = new Schema<IOrderLog>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false, // We only need createdAt which we set manually
  }
);

// Index for efficient time-based queries
OrderLogSchema.index({ createdAt: -1 });

// Unique index on orderId to prevent duplicate entries during migration
OrderLogSchema.index({ orderId: 1 }, { unique: true });

// Prevent model recompilation in development
const OrderLog = (mongoose.models && mongoose.models.OrderLog) || mongoose.model<IOrderLog>('OrderLog', OrderLogSchema);
export default OrderLog as mongoose.Model<IOrderLog>;
