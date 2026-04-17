import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "Gram2ghor",       // Cloudinary folder name
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
    },
});

const cloudinary_upload = multer({ storage });

export default cloudinary_upload;