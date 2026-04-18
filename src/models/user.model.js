import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
            // field ko optimizable tareeke se 
            // searchable banane ke lie 
            // index true kardete hai
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true
        },

        avatar: {
            type: String, // Cloudinary url
            required: true,
        },
        coverImage: {
            type: String, //Cloudinary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is Required !']
        },
        refreshToken: {
            type: String
        }

    },
    {
        timestamps: true
    }
)

// arrow function does not have the reference of 'this' ,
//  it does not knows the context , 
// thus we will use normal function here in pre hook

userSchema.pre("save", async function (next) {
    // agar if condition nahi laganege to fir kuch bhi
    //  save karne par password reencrypt ho jaega jo ki 
    // hame nahi chahiye , ham sirf tab password encrypt 
    // karna chahenge jab ya to user ne sign in kia ho ya 
    // fir use password change karna ho
    if (this.isModified("password")) {
        this.password = bcrypt.hash(this.password, 10)
        next()
    }
}) // async islie kyunki algorithms ko 
// run hone mei smaay lagta hai
// bcrypt -> ibrary which helps us to hash the passwords

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {//PAYLOAD
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {//PAYLOAD
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)

