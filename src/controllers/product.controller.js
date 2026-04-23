import ProductModel from "../models/product.model.js";
import CategoryModel from "../models/category.model.js";
import mongoose from "mongoose";

export const createProductController = async (request, response) => {
    try {
        const {
            firstName,
            lastName,
            category,
            weights,
            description
        } = request.body;

        const files = request.files || {};
        const coverImageFile = files['cover_image'];
        const cover_image = coverImageFile ? (Array.isArray(coverImageFile) ? coverImageFile[0]?.path : coverImageFile.path) : "";

        if (!firstName || !category || !weights) {
            return response.status(400).json({
                message: "Enter required fields (firstName, category, weights)",
                error: true,
                success: false
            });
        }

        let categoryId = category;
        if (typeof category === 'string') {
            if (mongoose.Types.ObjectId.isValid(category)) {
                categoryId = category;
            } else {
                const foundCat = await CategoryModel.findOne({ category_name: category });
                if (!foundCat) {
                    return response.status(400).json({
                        message: `Category not found: ${category}`,
                        error: true,
                        success: false
                    });
                }
                categoryId = foundCat._id;
            }
        }

        let weightsArray = [];
        try {
            weightsArray = typeof weights === 'string' ? JSON.parse(weights) : weights;
        } catch (error) {
            return response.status(400).json({
                message: "Invalid weights format",
                error: true,
                success: false
            });
        }

        const processedWeights = weightsArray.map((weightObj, index) => {
            const fieldKey = `weight_images_${index}`;
            const weightImageFiles = files[fieldKey];
            let weightImages = [];
            
            if (weightImageFiles) {
                weightImages = Array.isArray(weightImageFiles) 
                    ? weightImageFiles.map(f => f.path)
                    : [weightImageFiles.path];
            }

            return {
                weight: weightObj.weight,
                stock: weightObj.stock,
                price: weightObj.price,
                images: weightImages
            };
        });

        const product = new ProductModel({
            cover_image,
            firstName,
            lastName: lastName || "",
            category: categoryId,
            weights: processedWeights,
            description: description || ""
        });

        const saveProduct = await product.save();

        return response.json({
            message: "Product Created Successfully",
            data: saveProduct,
            error: false,
            success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

export const getProductController = async (request, response) => {
    try {
        let { page, limit, search } = request.body;

        if (!page) page = 1;
        if (!limit) limit = 10;

        const query = search ? {
            $or: [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } }
            ]
        } : {};

        const skip = (page - 1) * limit;

        const [data, totalCount] = await Promise.all([
            ProductModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('category'),
            ProductModel.countDocuments(query)
        ]);

        return response.json({
            message: "Product data",
            error: false,
            success: true,
            totalCount: totalCount,
            totalNoPage: Math.ceil(totalCount / limit),
            data: data
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

export const getProductByCategory = async (request, response) => {
    try {
        const { id } = request.body;

        if (!id) {
            return response.status(400).json({
                message: "provide category id",
                error: true,
                success: false
            });
        }

        const product = await ProductModel.find({
            category: { $in: id }
        }).limit(15);

        return response.json({
            message: "category product list",
            data: product,
            error: false,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

export const getProductDetails = async (request, response) => {
    try {
        const { productId } = request.body;

        const product = await ProductModel.findOne({ _id: productId }).populate('category');

        return response.json({
            message: "product details",
            data: product,
            error: false,
            success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

export const updateProductDetails = async (request, response) => {
    try {
        const { _id } = request.body;

        if (!_id) {
            return response.status(400).json({
                message: "provide product _id",
                error: true,
                success: false
            });
        }

        const updateData = { ...request.body };
        delete updateData._id;

        const updateProduct = await ProductModel.updateOne({ _id: _id }, updateData);

        return response.json({
            message: "updated successfully",
            data: updateProduct,
            error: false,
            success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

export const deleteProductDetails = async (request, response) => {
    try {
        const { _id } = request.body;

        if (!_id) {
            return response.status(400).json({
                message: "provide _id ",
                error: true,
                success: false
            });
        }

        const deleteProduct = await ProductModel.deleteOne({ _id: _id });

        return response.json({
            message: "Delete successfully",
            error: false,
            success: true,
            data: deleteProduct
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

export const searchProduct = async (request, response) => {
    try {
        let { search, page, limit } = request.body;

        if (!page) page = 1;
        if (!limit) limit = 10;

        const query = search ? {
            $or: [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } }
            ]
        } : {};

        const skip = (page - 1) * limit;

        const [data, dataCount] = await Promise.all([
            ProductModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('category'),
            ProductModel.countDocuments(query)
        ]);

        return response.json({
            message: "Product data",
            error: false,
            success: true,
            data: data,
            totalCount: dataCount,
            totalPage: Math.ceil(dataCount / limit),
            page: page,
            limit: limit
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};