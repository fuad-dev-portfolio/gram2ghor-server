import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()
import connectDB from "./config/connectDB.js";
import categoryRouter from './routes/category.route.js';
import productRouter from './routes/product.route.js';
import headerRouter from './routes/header.route.js';
import clientHeaderRouter from './routes/clientHeader.route.js';
import clientProductRouter from './routes/clientProduct.route.js';

const app = express();

const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'https://gram2ghor-frontend.vercel.app',
            'https://gram2ghor-frontend.vercel.app/'
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
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
app.use("/api/admin/header", headerRouter);
app.use("/api/client/header", clientHeaderRouter);
app.use("/api/client/product", clientProductRouter);

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("Server is running", PORT)
    })
});