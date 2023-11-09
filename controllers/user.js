import { User } from '../models/User.js';
import { Post } from '../models/Post.js';
import { sendEmail } from '../middlewares/sendEmail.js';
import crypto from "crypto";
import cloudinary from "cloudinary";


export const register = async (req, res) => {

    try {

        const { name, email, password, avatar } = req.body;

        let user = await User.findOne({ email });

        if (user) return res.status(400).json({
            success: false,
            message: "User already exists"
        });


        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
        });



        user = await User.create({
            name,
            email,
            password,
            avatar: { public_id: myCloud.public_id, url: myCloud.secure_url }
        });

        const token = await user.generateToken();

        res
            .status(201)
            .cookie("token", token, {
                httpOnly: true,
                expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                sameSite: process.env.NODE_ENV === "Development" ? "lax" : "none",
                secure : process.env.NODE_ENV === "Development" ? false : true,

            })
            .json({
                success: true,
                message: "register successfully",
                user,
                token,
            })


    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
};


export const login = async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email }).select("+password").populate("posts following followers");

        if (!user) return res.status(400).json({
            success: false,
            message: "User does not exist"
        });


        const isMatch = await user.matchPassword(password);

        if (!isMatch) return res.status(400).json({
            success: false,
            message: "Incorrect Password"
        });

        const token = await user.generateToken();

        return res
            .status(200)
            .cookie("token", token, {
                httpOnly: true,
                expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                sameSite: process.env.NODE_ENV === "Development" ? "lax" : "none",
                secure : process.env.NODE_ENV === "Development" ? false : true,

            })
            .json({
                success: true,
                message: "login successfully",
                user,
                token,
            })

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        })

    }

};

export const logout = (req, res) => {

    try {
        res
            .status(200)
            .cookie("token", null, {
                httpOnly: true,
                expires: new Date(Date.now())
            })
            .json({
                success: true,
                message: "Logout successfully"
            })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


export const followUser = async (req, res) => {

    try {

        const userToFollow = await User.findById(req.params.id);

        const loggedInUser = await User.findById(req.user._id);

        if (!userToFollow) {
            return res.status(404).json({
                success: false,
                message: "User Not Found",
            });
        }

        if (loggedInUser.following.includes(userToFollow._id)) {

            const indexFollowing = loggedInUser.following.indexOf(userToFollow._id);
            loggedInUser.following.splice(indexFollowing, 1);

            const indexFollowers = userToFollow.followers.indexOf(loggedInUser._id);
            userToFollow.followers.splice(indexFollowers, 1);

            await loggedInUser.save();
            await userToFollow.save();


            return res.status(200).json({
                success: true,
                message: "User UnFollowed",
            });


        } else {
            loggedInUser.following.push(userToFollow._id);
            userToFollow.followers.push(loggedInUser._id);

            await loggedInUser.save();
            await userToFollow.save();

            return res.status(200).json({
                success: true,
                message: "User Followed",
            });
        }



    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


export const updatePassword = async (req, res) => {

    try {

        const user = await User.findById(req.user._id).select("+password");

        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Please provide old and new password",
            });
        }

        const isMatch = await user.matchPassword(oldPassword);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect Old Password",
            });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password Updated",
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};



export const updateProfile = async (req, res) => {

    try {

        const user = await User.findById(req.user._id);

        const { name, email, avatar } = req.body;

        if (name) {
            user.name = name;
        }

        if (email) {
            user.email = email;
        }

        // Updated Avatar : Todo

        if (avatar) {
            await cloudinary.v2.uploader.destroy(user.avatar.public_id);

            const myCloud = await cloudinary.v2.uploader.upload(avatar, {
                folder: "avatars",
            })

            user.avatar.public_id = myCloud.public_id;
            user.avatar.url = myCloud.secure_url;
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile Updated",
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



export const deleteMyProfile = async (req, res) => {

    try {

        // Delete the user
        const user = await User.findById(req.user._id);
        const userId = user._id;
        const followers = user.followers;
        const following = user.following;
        const posts = user.posts;


        // Delete Avatar from cloudinary
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);


        await user.deleteOne();


        // Logout user after deleting profile
        res.cookie("token", null, {
            httpOnly: true,
            expires: new Date(Date.now())
        });


        // Delete all posts of the user  && delete photo from cloudinary
        for (let i = 0; i < posts.length; i++) {
            const post = await Post.findById(posts[i]);
            await cloudinary.v2.uploader.destroy(post.image.public_id);
            await post.deleteOne();
        }

        //Removing User from Followers Following
        for (let i = 0; i < followers.length; i++) {
            const follower = await User.findById(followers[i]);

            const index = follower.following.indexOf(userId);
            follower.following.splice(index, 1);
            await follower.save();
        }

        // Removing User from Following's Followers
        for (let i = 0; i < following.length; i++) {
            const follows = await User.findById(following[i]);

            const index = follows.followers.indexOf(userId);
            follows.followers.splice(index, 1);
            await follows.save();
        }


        // Removing all comments of the user from all posts
        const allPosts = await Post.find();

        for (let i = 0; i < allPosts.length; i++) {
            const post = await Post.findById(allPosts[i]._id);

            for (let j = 0; j < post.comments.length; j++) {
                if (post.comments[j].user === userId) {
                    post.comments.splice(j, 1);
                }
            }

            await post.save();
        }


        // Removing all likes of the user from all posts
        for (let i = 0; i < allPosts.length; i++) {
            const post = await Post.findById(allPosts[i]._id);

            for (let j = 0; j < post.likes.length; j++) {
                if (post.likes[j] === userId) {
                    post.likes.splice(j, 1);
                }
            }

            await post.save();
        }






        res.status(200).json({
            success: true,
            message: "Profile Deleted"
        });

    } catch (error) {

        res.status(500).json({
            success: true,
            message: error.message,
        })
    }
};


export const myProfile = async (req, res) => {

    try {

        const user = await User.findById(req.user._id).populate("posts followers following");

        res.status(200).json({
            success: true,
            user,
        });

    } catch (error) {
        res.status(500).json({
            success: true,
            message: error.message,
        })
    }
};


export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate(
            "posts followers following"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ name: { $regex: req.query.name, $options: 'i' } });

        res.status(200).json({
            success: true,
            users,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


export const forgotPassword = async (req, res) => {

    try {

        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const resetPasswordToken = user.getResetPasswordToken();
        // console.log(resetPasswordToken);

        await user.save();

        const resetUrl = `${req.protocol}://${req.get("host")}/password/reset/${resetPasswordToken}`;
        // console.log(resetUrl);

        const message = `Reset Your Password by clicking on the link below: \n\n ${resetUrl}`;
        // console.log(message);

        try {

            await sendEmail({
                email: user.email,
                subject: "Reset Password",
                message,
            });

            res.status(200).json({
                success: true,
                message: `Email sent to ${user.email}`,
            });

        } catch (error) {

            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save();

            res.status(500).json({
                success: false,
                message: error.message,
            });
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

export const resetPassword = async (req, res) => {

    try {

        const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Token is invalid or has expired",
            });
        }

        user.password = req.body.password;

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({
            success: true,
            message: "Password Updated",
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}




export const getMyPosts = async (req, res) => {
    try {

        const user = await User.findById(req.user._id);

        const posts = [];

        for (let i = 0; i < user.posts.length; i++) {
            const post = await Post.findById(user.posts[i]).populate("likes comments.user owner");
            posts.push(post);
        }

        res.status(200).json({
            success: true,
            posts,
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export const getUserPosts = async (req, res) => {
    try {

        const user = await User.findById(req.params.id);

        const posts = [];

        for (let i = 0; i < user.posts.length; i++) {
            const post = await Post.findById(user.posts[i]).populate("likes comments.user owner");
            posts.push(post);
        }

        res.status(200).json({
            success: true,
            posts,
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}