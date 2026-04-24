import { Router } from 'express';
import ProductModel from '../models/product.model.js';

const clientProductRouter = Router();

clientProductRouter.get('/products', async (req, res) => {
    try {
        const { page, limit, search, category } = req.query;

        const pageNum = page ? parseInt(page) : 1;
        const limitNum = limit ? parseInt(limit) : 10;

        const query = search ? {
            $or: [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } }
            ]
        } : {};

        if (category) {
            query.category = category;
        }

        const skip = (pageNum - 1) * limitNum;

        const [data, totalCount] = await Promise.all([
            ProductModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).populate('category'),
            ProductModel.countDocuments(query)
        ]);

        return res.json({
            message: "Product data",
            error: false,
            success: true,
            totalCount: totalCount,
            totalNoPage: Math.ceil(totalCount / limitNum),
            data: data
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
});

clientProductRouter.get('/product/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const product = await ProductModel.findById(id).populate('category');

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                error: true,
                success: false
            });
        }

        return res.json({
            message: "Product details",
            data: product,
            error: false,
            success: true
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
});

export default clientProductRouter;