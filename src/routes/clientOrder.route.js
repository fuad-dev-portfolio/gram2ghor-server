import { Router } from 'express';
import OrderModel from '../models/order.model.js';
import CartModel from '../models/cart.model.js';

const clientOrderRouter = Router();

const getGuestId = (req) => {
    return req.headers['guest-id'] || null;
};

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

clientOrderRouter.post('/create', asyncHandler(async (req, res) => {
    const { 
        customerName, 
        customerPhone, 
        customerEmail, 
        shippingAddress, 
        city = '',
        paymentMethod = 'cash_on_delivery',
        notes = ''
    } = req.body;
    
    let guestId = getGuestId(req);

    if (!guestId) {
        return res.status(400).json({
            message: "Guest ID required",
            error: true,
            success: false
        });
    }

    let cart = await CartModel.findOne({ guestId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
        return res.status(400).json({
            message: "Cart is empty",
            error: true,
            success: false
        });
    }

    if (!customerName || !customerPhone || !shippingAddress) {
        return res.status(400).json({
            message: "Please provide all required fields",
            error: true,
            success: false
        });
    }

    const orderItems = cart.items.map(item => ({
        product: item.product._id,
        productName: item.product.firstName,
        productImage: item.product.cover_image,
        quantity: item.quantity,
        weight: item.weight,
        price: item.price,
        totalPrice: item.price * item.quantity
    }));

    const subtotal = cart.totalAmount;
    const deliveryCharge = 0;
    const totalAmount = subtotal + deliveryCharge;

    // Generate order ID
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderId = `GG-${timestamp}${random}`;

    const order = new OrderModel({
        orderId,
        guestId,
        customerName,
        customerPhone,
        customerEmail: customerEmail || '',
        shippingAddress,
        city,
        items: orderItems,
        subtotal,
        deliveryCharge,
        totalAmount,
        paymentMethod,
        notes
    });

    await order.save();
    await CartModel.findOneAndDelete({ guestId });

    res.json({
        message: "Order placed successfully",
        data: order,
        error: false,
        success: true
    });
}));

clientOrderRouter.get('/list', asyncHandler(async (req, res) => {
    let guestId = getGuestId(req);

    if (!guestId) {
        return res.json({
            message: "Order list",
            data: [],
            error: false,
            success: true
        });
    }

    const orders = await OrderModel.find({ guestId }).sort({ createdAt: -1 });

    res.json({
        message: "Order list",
        data: orders,
        error: false,
        success: true
    });
}));

clientOrderRouter.get('/:orderId', asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    let guestId = getGuestId(req);

    const query = { orderId };
    if (guestId) {
        query.guestId = guestId;
    }

    const order = await OrderModel.findOne(query);

    if (!order) {
        return res.status(404).json({
            message: "Order not found",
            error: true,
            success: false
        });
    }

    res.json({
        message: "Order details",
        data: order,
        error: false,
        success: true
    });
}));

export default clientOrderRouter;