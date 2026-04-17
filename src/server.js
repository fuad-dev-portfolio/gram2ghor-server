import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()
import connectDB from "./config/connectDB.js";
import categoryRouter from './routes/category.route.js';
import productRouter from './routes/product.route.js';

const app = express();

const corsOptions = {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}
app.use(cors(corsOptions))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const PORT = process.env.PORT || 8080

app.get("/", (request, response) => {
    ///server to client
    response.json({
        message: "Gram2ghor.com is under development " + PORT
    })
})

app.use("/api/admin/category", categoryRouter);
app.use("/api/admin/product", productRouter);

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("Server is running", PORT)
    })
});