import { Router } from 'express';
import CartModel from '../models/cart.model.js';
import ProductModel from '../models/product.model.js';

const clientCartRouter = Router();

const getGuestId = (req) => {
    return req.headers['guest-id'] || null;
};

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

clientCartRouter.get('/get', asyncHandler(async (req, res) => {
    const guestId = getGuestId(req) || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    let cart = await CartModel.findOne({ guestId }).populate('items.product');

    if (!cart) {
        cart = new CartModel({
            guestId,
            items: [],
            totalAmount: 0
        });
    }

    res.setHeader('guest-id', guestId);

    res.json({
        message: "Cart data",
        data: cart,
        error: false,
        success: true
    });
}));

clientCartRouter.post('/add', asyncHandler(async (req, res) => {
    const { productId, quantity = 1, weight, price } = req.body;
    let guestId = getGuestId(req) || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

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

    let cart = await CartModel.findOne({ guestId });

    if (!cart) {
        cart = new CartModel({
            guestId,
            items: [],
            totalAmount: 0
        });
    }

    const existingItemIndex = cart.items.findIndex(
        item => item.product.toString() === productId && item.weight === (weight || '')
    );

    if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += quantity;
    } else {
        cart.items.push({
            product: productId,
            quantity,
            weight: weight || '',
            price: price || product.weights[0]?.price || 0
        });
    }

    cart.totalAmount = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    await cart.save();
    res.setHeader('guest-id', guestId);

    res.json({
        message: "Product added to cart",
        data: cart,
        error: false,
        success: true
    });
}));

clientCartRouter.put('/update', asyncHandler(async (req, res) => {
    const { itemId, quantity } = req.body;
    let guestId = getGuestId(req);

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
}));

clientCartRouter.delete('/remove/:itemId', asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    let guestId = getGuestId(req);

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
}));

clientCartRouter.delete('/clear', asyncHandler(async (req, res) => {
    let guestId = getGuestId(req);

    if (guestId) {
        await CartModel.findOneAndDelete({ guestId });
    }

    res.json({
        message: "Cart cleared",
        error: false,
        success: true
    });
}));

export default clientCartRouter;