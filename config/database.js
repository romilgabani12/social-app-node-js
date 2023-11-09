import mongoose from "mongoose";

export const connectDB = ()=>{
    mongoose.connect(process.env.MONGO_URI, {
        dbName : "Social_Media",
    }).then((c)=>{
        console.log(`Databse is connected with ${c.connection.host}`);
    }).catch((e)=>{
        console.log(e);
    })
}