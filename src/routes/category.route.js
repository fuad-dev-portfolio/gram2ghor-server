import { Router } from 'express'
import cloudinary_upload from '../middlewares/uploadImage.js'
import { AddCategoryController, deleteCategoryController, getCategoryController, updateCategoryController } from '../controllers/category.controller.js'

const categoryRouter = Router()

categoryRouter.post("/add-category", cloudinary_upload.single("category_image"), AddCategoryController)
categoryRouter.get('/get-all-category', getCategoryController)
categoryRouter.put('/update-category', cloudinary_upload.single("category_image"), updateCategoryController)
categoryRouter.delete("/delete-category", deleteCategoryController)


export default categoryRouter