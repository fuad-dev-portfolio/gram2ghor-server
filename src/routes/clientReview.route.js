import { Router } from 'express';
import ReviewModel from '../models/review.model.js';

const clientReviewRouter = Router();

clientReviewRouter.post('/create', async (req, res) => {
    try {
        const { name, rating, comment, image } = req.body;

        if (!name || !rating || !comment) {
            return res.status(400).json({
                message: "Name, rating, and comment are required",
                error: true,
                success: false
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                message: "Rating must be between 1 and 5",
                error: true,
                success: false
            });
        }

        const review = new ReviewModel({ name, rating, comment, image: image || "" });
        await review.save();

        return res.status(201).json({
            message: "Review submitted successfully",
            error: false,
            success: true,
            data: review
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
});

clientReviewRouter.get('/reviews', async (req, res) => {
    try {
        const reviews = await ReviewModel.find().sort({ createdAt: -1 });

        return res.json({
            message: "Reviews fetched successfully",
            error: false,
            success: true,
            data: reviews
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
});

export default clientReviewRouter;
