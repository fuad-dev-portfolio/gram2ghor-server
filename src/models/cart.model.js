import mongoose, { Schema, model } from 'mongoose';

const cartItemSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1
    },
    weight: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        required: true
    }
}, { _id: true });

const cartSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    guestId: {
        type: String,
        default: null
    },
    items: [cartItemSchema],
    totalAmount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

cartSchema.pre('save', function(next) {
    this.totalAmount = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    next();
});

const CartModel = model('Cart', cartSchema);

export default CartModel;