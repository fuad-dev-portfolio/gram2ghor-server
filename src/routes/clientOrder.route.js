import { Router } from 'express';
import OrderModel from '../models/order.model.js';
import CartModel from '../models/cart.model.js';

const clientOrderRouter = Router();

const generateOrderId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `GG-${timestamp}${random}`;
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
        
        const userId = req.user?._id || null;
        const guestId = req.headers['guest-id'] || null;

        let cart = await CartModel.findOne({
            $or: [
                { user: userId },
                { guestId: guestId }
            ]
        }).populate('items.product');

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
            orderId: generateOrderId(),
            user: userId,
            guestId: userId ? null : guestId,
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

        await CartModel.findByIdAndDelete(cart._id);

        return res.json({
            message: "Order placed successfully",
            data: order,
            error: false,
            success: true
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: true,
            success: false
        });
    }
});

clientOrderRouter.get('/list', async (req, res) => {
    try {
        const userId = req.user?._id;
        const guestId = req.headers['guest-id'] || null;

        const orders = await OrderModel.find({
            $or: [
                { user: userId },
                { guestId: guestId }
            ]
        }).sort({ createdAt: -1 });

        return res.json({
            message: "Order list",
            data: orders,
            error: false,
            success: true
        });
    } catch (error) {
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
        const userId = req.user?._id;
        const guestId = req.headers['guest-id'] || null;

        const order = await OrderModel.findOne({
            orderId,
            $or: [
                { user: userId },
                { guestId: guestId }
            ]
        });

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
        return res.status(500).json({
            message: error.message,
            error: true,
            success: false
        });
    }
});

export default clientOrderRouter;