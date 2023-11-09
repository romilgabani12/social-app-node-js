import { User } from "../models/User.js";
import jwt from "jsonwebtoken";

export const isAuthenticated = async (req, res, next) => {

    try {
        const { token } = req.cookies;

        if (!token) return res.status(401).json({
            message: "please login first"
        });


        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decoded._id);


        next();

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        })

    }


};