import { Router } from 'express';
import CartModel from '../models/cart.model.js';

const clientCartRouter = Router();

const getGuestId = (req) => {
    return req.headers['guest-id'] || null;
};

clientCartRouter.get('/get', async (req, res) => {
    try {
        let guestId = getGuestId(req);
        if (!guestId) {
            guestId = `guest_${Date.now()}`;
        }

        let cart = await CartModel.findOne({ guestId });

        if (!cart) {
            cart = new CartModel({
                guestId: guestId,
                items: [],
                totalAmount: 0
            });
            await cart.save();
        }

        res.setHeader('guest-id', guestId);
        
        res.json({
            message: "Cart data",
            data: cart,
            error: false,
            success: true
        });
    } catch (error) {
        console.error('Cart get error:', error);
        res.status(500).json({
            message: error.message,
            error: true,
            success: false
        });
    }
});

clientCartRouter.post('/add', async (req, res) => {
    try {
        const { productId, productName, productImage, quantity = 1, weight, price } = req.body;
        let guestId = getGuestId(req);
        
        if (!guestId) {
            guestId = `guest_${Date.now()}`;
        }

        if (!productId || !price) {
            return res.status(400).json({
                message: "Product ID and price are required",
                error: true,
                success: false
            });
        }

        let cart = await CartModel.findOne({ guestId });
        
        if (!cart) {
            cart = new CartModel({
                guestId: guestId,
                items: [],
                totalAmount: 0
            });
        }

        // Clean up old items - check if any item has old 'product' field
        const hasOldFormat = cart.items.some(item => item.product && !item.productId);
        if (hasOldFormat) {
            await CartModel.deleteOne({ guestId });
            cart = new CartModel({
                guestId: guestId,
                items: [],
                totalAmount: 0
            });
        }

        // Check if item already exists
        const existingItemIndex = cart.items.findIndex(
            item => item.productId === productId && item.weight === (weight || '')
        );

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            cart.items.push({
                productId: productId,
                productName: productName || '',
                productImage: productImage || '',
                quantity: quantity,
                weight: weight || '',
                price: price
            });
        }

        // Recalculate total
        cart.totalAmount = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

        await cart.save();

        res.setHeader('guest-id', guestId);

        res.json({
            message: "Product added to cart",
            data: cart,
            error: false,
            success: true
        });
    } catch (error) {
        console.error('Cart add error:', error);
        res.status(500).json({
            message: error.message,
            error: true,
            success: false
        });
    }
});

clientCartRouter.put('/update', async (req, res) => {
    try {
        const { itemId, quantity } = req.body;
        const guestId = getGuestId(req);

        if (!guestId) {
            return res.status(400).json({
                message: "Guest ID required",
                error: true,
                success: false
            });
        }

        const cart = await CartModel.findOne({ guestId });
        if (!cart) {
            return res.status(404).json({
                message: "Cart not found",
                error: true,
                success: false
            });
        }

        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex > -1) {
            if (quantity > 0) {
                cart.items[itemIndex].quantity = quantity;
            } else {
                cart.items.splice(itemIndex, 1);
            }
            cart.totalAmount = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
            await cart.save();
        }

        res.json({
            message: "Cart updated",
            data: cart,
            error: false,
            success: true
        });
    } catch (error) {
        console.error('Cart update error:', error);
        res.status(500).json({
            message: error.message,
            error: true,
            success: false
        });
    }
});

clientCartRouter.delete('/remove/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;
        const guestId = getGuestId(req);

        if (!guestId) {
            return res.status(400).json({
                message: "Guest ID required",
                error: true,
                success: false
            });
        }

        const cart = await CartModel.findOne({ guestId });
        if (!cart) {
            return res.status(404).json({
                message: "Cart not found",
                error: true,
                success: false
            });
        }

        cart.items = cart.items.filter(item => item._id.toString() !== itemId);
        cart.totalAmount = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        await cart.save();

        res.json({
            message: "Item removed from cart",
            data: cart,
            error: false,
            success: true
        });
    } catch (error) {
        console.error('Cart remove error:', error);
        res.status(500).json({
            message: error.message,
            error: true,
            success: false
        });
    }
});

export default clientCartRouter;