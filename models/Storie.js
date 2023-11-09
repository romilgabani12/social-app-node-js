import mongoose from "mongoose";

const storieSchema = new mongoose.Schema({

    image: {
        public_id: String,
        url: String,
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },

    // likes: [
    //     {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: "User",
    //     }
    // ],



});

export const Storie = mongoose.model("Storie", storieSchema);