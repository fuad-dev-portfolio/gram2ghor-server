import mongoose, { Schema, model } from 'mongoose';

const orderItemSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: String,
    productImage: String,
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    weight: String,
    price: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    }
});

const orderSchema = new Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    guestId: {
        type: String,
        default: null
    },
    customerName: {
        type: String,
        required: true
    },
    customerPhone: {
        type: String,
        required: true
    },
    customerEmail: String,
    shippingAddress: {
        type: String,
        required: true
    },
    city: String,
    items: [orderItemSchema],
    subtotal: {
        type: Number,
        required: true
    },
    deliveryCharge: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cash_on_delivery', 'online'],
        default: 'cash_on_delivery'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    notes: String
}, {
    timestamps: true
});

const generateOrderId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `GG-${timestamp}${random}`;
};

orderSchema.pre('save', async function(next) {
    if (!this.orderId) {
        this.orderId = generateOrderId();
    }
    next();
});

const OrderModel = model('Order', orderSchema);

export default OrderModel;