import { Router } from 'express';
import CartModel from '../models/cart.model.js';
import ProductModel from '../models/product.model.js';

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

        console.log('GET cart, guestId:', guestId);

        let cart = await CartModel.findOne({ guestId }).populate('items.product');
        console.log('Found cart:', cart?._id, 'items:', cart?.items?.length);

        if (!cart) {
            // Create empty cart if doesn't exist
            cart = new CartModel({
                guestId: guestId,
                items: [],
                totalAmount: 0
            });
            await cart.save();
            console.log('Created new cart:', cart._id);
        }

        res.setHeader('guest-id', guestId);
        res.setHeader('Access-Control-Allow-Headers', 'guest-id');
        
        res.json({
            message: "Cart data",
            data: {
                _id: cart._id,
                guestId: cart.guestId,
                items: cart.items,
                totalAmount: cart.totalAmount
            },
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
        const { productId, quantity = 1, weight, price } = req.body;
        let guestId = getGuestId(req);
        
        if (!guestId) {
            guestId = `guest_${Date.now()}`;
        }

        console.log('ADD to cart, guestId:', guestId, 'productId:', productId);

        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required",
                error: true,
                success: false
            });
        }

        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                error: true,
                success: false
            });
        }

        // Find or create cart
        let cart = await CartModel.findOne({ guestId });
        
        if (!cart) {
            cart = new CartModel({
                guestId: guestId,
                items: [],
                totalAmount: 0
            });
        }

        // Calculate item price
        const itemPrice = price || product.weights[0]?.price || 0;
        const itemWeight = weight || '';

        // Check if item already exists
        const existingItemIndex = cart.items.findIndex(
            item => item.product.toString() === productId && item.weight === itemWeight
        );

        console.log('Existing item index:', existingItemIndex);

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            cart.items.push({
                product: productId,
                quantity: quantity,
                weight: itemWeight,
                price: itemPrice
            });
        }

        // Recalculate total
        cart.totalAmount = 0;
        for (const item of cart.items) {
            cart.totalAmount += item.price * item.quantity;
        }

        await cart.save();
        console.log('Cart saved, items:', cart.items.length, 'total:', cart.totalAmount);

        res.setHeader('guest-id', guestId);
        res.setHeader('Access-Control-Allow-Headers', 'guest-id');

        res.json({
            message: "Product added to cart",
            data: {
                _id: cart._id,
                guestId: cart.guestId,
                items: cart.items,
                totalAmount: cart.totalAmount
            },
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

clientCartRouter.delete('/clear', async (req, res) => {
    try {
        const guestId = getGuestId(req);

        if (guestId) {
            await CartModel.findOneAndDelete({ guestId });
        }

        res.json({
            message: "Cart cleared",
            error: false,
            success: true
        });
    } catch (error) {
        console.error('Cart clear error:', error);
        res.status(500).json({
            message: error.message,
            error: true,
            success: false
        });
    }
});

export default clientCartRouter;