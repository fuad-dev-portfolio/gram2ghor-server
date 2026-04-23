import mongoose from "mongoose";

const weightSchema = new mongoose.Schema({
    weight: {
        type: String,
        required: true
    },
    stock: {
        type: Number,
        default: 0,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    images: {
        type: Array,
        default: []
    }
}, { _id: false });

const productSchema = new mongoose.Schema({
    cover_image: {
        type: String,
        default: ""
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        default: ""
    },
    category: {
        type: mongoose.Schema.ObjectId,
        ref: 'category',
        required: true
    },
    weights: [weightSchema],
    description: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

productSchema.index({
    firstName: "text",
    lastName: "text",
    description: 'text'
});

const ProductModel = mongoose.model('product', productSchema);

export default ProductModel;