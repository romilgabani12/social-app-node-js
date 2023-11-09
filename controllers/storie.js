import { Post } from '../models/Post.js';
import { User } from '../models/User.js';
import { Storie } from '../models/Storie.js';
import cloudinary from "cloudinary";


export const createStorie = async (req, res) => {

    try {

        const myCloud = await cloudinary.v2.uploader.upload(req.body.image, {
            folder: "stories",
        });

        const newStorieData = {
            image: {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            },
            owner: req.user._id
        }


        const newStorie = await Storie.create(newStorieData);

        const user = await User.findById(req.user._id);

        user.stories.unshift(newStorie._id);

        await user.save();

        res.status(201).json({
            success: true,
            message: "Storie Created",
            storie: newStorie,
        });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            success: false,
            message: error.message
        })

    }

};



export const getMyStories = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        const stories = [];

        for (let i = 0; i < user.stories.length; i++) {
            const storie = await Storie.findById(user.stories[i]);
            stories.push(storie);
        }

        res.status(200).json({
            success: true,
            stories,
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}


export const getUserStories = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        const stories = [];

        for (let i = 0; i < user.stories.length; i++) {
            const storie = await Storie.findById(user.stories[i]);
            stories.push(storie);
        }

        res.status(200).json({
            success: true,
            stories,
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}