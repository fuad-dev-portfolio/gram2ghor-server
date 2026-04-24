import { Router } from 'express';
import OrderModel from '../models/order.model.js';
import CartModel from '../models/cart.model.js';

const clientOrderRouter = Router();

const getGuestId = (req) => {
    return req.headers['guest-id'] || null;
};

clientOrderRouter.post('/create', async (req, res) => {
    try {
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

        let cart = await CartModel.findOne({ guestId });

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

        // Use stored product info directly
        const orderItems = cart.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
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
        
        // Clear cart after order
        await CartModel.deleteOne({ guestId });

        res.json({
            message: "Order placed successfully",
            data: order,
            error: false,
            success: true
        });
    } catch (error) {
        console.error('Order create error:', error);
        res.status(500).json({
            message: error.message,
            error: true,
            success: false
        });
    }
});

clientOrderRouter.get('/list', async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Order list error:', error);
        res.status(500).json({
            message: error.message,
            error: true,
            success: false
        });
    }
});

clientOrderRouter.get('/:orderId', async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Order get error:', error);
        res.status(500).json({
            message: error.message,
            error: true,
            success: false
        });
    }
});

export default clientOrderRouter;