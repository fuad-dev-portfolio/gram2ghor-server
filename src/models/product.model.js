import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: Array,
        default: []
    },
    category: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'category'
        }
    ],
    unit: {
        type: String,
        default: "",
        required: true
    },
    stock: {
        type: Number,
        default: null,
        required: true
    },
    price: {
        type: Number,
        defualt: null,
        required: true
    },
    discount: {
        type: Number,
        default: null
    },
    description: {
        type: String,
        default: "",
        required: true
    }
}, {
    timestamps: true
})

//create a text index
productSchema.index({
    name: "text",
    description: 'text'
}, {
    name: 10,
    description: 5
})


const ProductModel = mongoose.model('product', productSchema)

export default ProductModel