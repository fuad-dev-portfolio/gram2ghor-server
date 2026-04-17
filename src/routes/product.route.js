import { Router } from 'express'
import { createProductController, deleteProductDetails, getProductByCategory, getProductController, getProductDetails, searchProduct, updateProductDetails } from '../controllers/product.controller.js'
import cloudinary_upload from '../middlewares/uploadImage.js'

const productRouter = Router()

productRouter.post("/upload-product", cloudinary_upload.array("image", 10), createProductController)
productRouter.post('/get-all-product', getProductController)
productRouter.post("/get-product-by-category", getProductByCategory)
productRouter.post('/get-product-details', getProductDetails)

//update product
productRouter.put('/update-product-details', updateProductDetails)

//delete product
productRouter.delete('/delete-product', deleteProductDetails)

//search product 
productRouter.post('/search-product', searchProduct)

export default productRouter