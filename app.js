import express from "express";
import { config } from "dotenv";
import postRouter from './routes/post.js';
import userRouter from './routes/user.js';
import storieRouter from './routes/storie.js';
import cookieParser from "cookie-parser";
import cors from "cors";

export const app = express();

if (process.env.NODE_ENV !== "Production") {

    // to connect a dotenv file oterwise error is occur
    config({
        path: "config/config.env",
    })

}

// Using middleware

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

app.use(cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));


// Using Routes

app.use("/api/v1", postRouter);
app.use("/api/v1", userRouter);
app.use("/api/v1", storieRouter);




