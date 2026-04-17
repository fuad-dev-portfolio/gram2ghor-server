import ProductModel from "../models/product.model.js";
import CategoryModel from "../models/category.model.js";
import mongoose from "mongoose";

export const createProductController = async (request, response) => {
    try {
        const {
            name,
            category,
            unit,
            stock,
            price,
            discount,
            description
        } = request.body

        // multiple image upload fix - handle missing files array
        const image = request.files ? request.files.map(file => file.path) : [];

        if (!name || image.length === 0 || !category || !unit || !price || !description) {
            return response.status(400).json({
                message: "Enter required fields",
                error: true,
                success: false
            })
        }

        // Parse category if it's sent as a stringified array from FormData
        let categoryList = [];
        try {
            categoryList = typeof category === 'string' ? JSON.parse(category) : category;
        } catch (error) {
            categoryList = typeof category === 'string' ? category.split(',') : [category];
        }
        
        if (!Array.isArray(categoryList)) {
            categoryList = [categoryList];
        }

        let validCategoryIds = [];
        for (const cat of categoryList) {
            if (mongoose.Types.ObjectId.isValid(cat)) {
                validCategoryIds.push(cat);
            } else {
                 // Lookup category by name if a name like "Honey" is passed
                 const foundCat = await CategoryModel.findOne({ category_name: cat });
                 if (foundCat) {
                     validCategoryIds.push(foundCat._id);
                 } else {
                     return response.status(400).json({
                         message: `Category not found: ${cat}`,
                         error: true,
                         success: false
                     })
                 }
            }
        }

        const product = new ProductModel({
            name,
            image,
            category: validCategoryIds,
            unit,
            stock,
            price,
            discount,
            description
        })
        const saveProduct = await product.save()

        return response.json({
            message: "Product Created Successfully",
            data: saveProduct,
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
};

export const getProductController = async (request, response) => {
    try {

        let { page, limit, search } = request.body

        if (!page) {
            page = 1
        }

        if (!limit) {
            limit = 10
        }

        const query = search ? {
            $text: {
                $search: search
            }
        } : {}

        const skip = (page - 1) * limit

        const [data, totalCount] = await Promise.all([
            ProductModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('category subCategory'),
            ProductModel.countDocuments(query)
        ])

        return response.json({
            message: "Product data",
            error: false,
            success: true,
            totalCount: totalCount,
            totalNoPage: Math.ceil(totalCount / limit),
            data: data
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const getProductByCategory = async (request, response) => {
    try {
        const { id } = request.body

        if (!id) {
            return response.status(400).json({
                message: "provide category id",
                error: true,
                success: false
            })
        }

        const product = await ProductModel.find({
            category: { $in: id }
        }).limit(15)

        return response.json({
            message: "category product list",
            data: product,
            error: false,
            success: true
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export const getProductDetails = async (request, response) => {
    try {
        const { productId } = request.body

        const product = await ProductModel.findOne({ _id: productId })


        return response.json({
            message: "product details",
            data: product,
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

//update product
export const updateProductDetails = async (request, response) => {
    try {
        const { _id } = request.body

        if (!_id) {
            return response.status(400).json({
                message: "provide product _id",
                error: true,
                success: false
            })
        }

        const updateProduct = await ProductModel.updateOne({ _id: _id }, {
            ...request.body
        })

        return response.json({
            message: "updated successfully",
            data: updateProduct,
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

//delete product
export const deleteProductDetails = async (request, response) => {
    try {
        const { _id } = request.body

        if (!_id) {
            return response.status(400).json({
                message: "provide _id ",
                error: true,
                success: false
            })
        }

        const deleteProduct = await ProductModel.deleteOne({ _id: _id })

        return response.json({
            message: "Delete successfully",
            error: false,
            success: true,
            data: deleteProduct
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

//search product
export const searchProduct = async (request, response) => {
    try {
        let { search, page, limit } = request.body

        if (!page) {
            page = 1
        }
        if (!limit) {
            limit = 10
        }

        const query = search ? {
            $text: {
                $search: search
            }
        } : {}

        const skip = (page - 1) * limit

        const [data, dataCount] = await Promise.all([
            ProductModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('category subCategory'),
            ProductModel.countDocuments(query)
        ])

        return response.json({
            message: "Product data",
            error: false,
            success: true,
            data: data,
            totalCount: dataCount,
            totalPage: Math.ceil(dataCount / limit),
            page: page,
            limit: limit
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}