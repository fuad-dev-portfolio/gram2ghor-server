import { Router } from 'express';
import CartModel from '../models/cart.model.js';
import ProductModel from '../models/product.model.js';

const clientCartRouter = Router();

const getGuestId = (req) => {
    return req.cookies?.guestId || req.headers['guest-id'] || null;
};

clientCartRouter.get('/get', async (req, res) => {
    try {
        const userId = req.user?._id;
        const guestId = getGuestId(req);

        let cart = await CartModel.findOne({
            $or: [
                { user: userId },
                { guestId: guestId }
            ]
        }).populate('items.product');

        if (!cart) {
            cart = new CartModel({
                user: userId || null,
                guestId: guestId || null,
                items: [],
                totalAmount: 0
            });
        }

        return res.json({
            message: "Cart data",
            data: cart,
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

clientCartRouter.post('/add', async (req, res) => {
    try {
        const { productId, quantity = 1, weight, price } = req.body;
        const userId = req.user?._id;
        const guestId = getGuestId(req) || `guest_${Date.now()}`;

        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                error: true,
                success: false
            });
        }

        let cart = await CartModel.findOne({
            $or: [
                { user: userId },
                { guestId: guestId }
            ]
        });

        if (!cart) {
            cart = new CartModel({
                user: userId || null,
                guestId: userId ? null : guestId,
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

        await cart.save();

        return res.json({
            message: "Product added to cart",
            data: cart,
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

clientCartRouter.put('/update', async (req, res) => {
    try {
        const { itemId, quantity } = req.body;
        const userId = req.user?._id;
        const guestId = getGuestId(req);

        const cart = await CartModel.findOne({
            $or: [
                { user: userId },
                { guestId: guestId }
            ]
        });

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
            await cart.save();
        }

        return res.json({
            message: "Cart updated",
            data: cart,
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

clientCartRouter.delete('/remove/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;
        const userId = req.user?._id;
        const guestId = getGuestId(req);

        const cart = await CartModel.findOne({
            $or: [
                { user: userId },
                { guestId: guestId }
            ]
        });

        if (!cart) {
            return res.status(404).json({
                message: "Cart not found",
                error: true,
                success: false
            });
        }

        cart.items = cart.items.filter(item => item._id.toString() !== itemId);
        await cart.save();

        return res.json({
            message: "Item removed from cart",
            data: cart,
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

clientCartRouter.delete('/clear', async (req, res) => {
    try {
        const userId = req.user?._id;
        const guestId = getGuestId(req);

        await CartModel.findOneAndDelete({
            $or: [
                { user: userId },
                { guestId: guestId }
            ]
        });

        return res.json({
            message: "Cart cleared",
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

export default clientCartRouter;