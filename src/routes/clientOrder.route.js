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

        const order = new OrderModel({
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

        return res.json({
            message: "Order placed successfully",
            data: order,
            error: false,
            success: true
        });
    } catch (error) {
        console.error('Order create error:', error);
        return res.status(500).json({
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

        return res.json({
            message: "Order list",
            data: orders,
            error: false,
            success: true
        });
    } catch (error) {
        console.error('Order list error:', error);
        return res.status(500).json({
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

        return res.json({
            message: "Order details",
            data: order,
            error: false,
            success: true
        });
    } catch (error) {
        console.error('Order get error:', error);
        return res.status(500).json({
            message: error.message,
            error: true,
            success: false
        });
    }
});

export default clientOrderRouter;