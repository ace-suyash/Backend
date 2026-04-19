import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const generateAccessAndRefreshTokens = async(userId) => {
    try{
        const user = await User.findById(userId) // user ka access mil gaya
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false}) // database operation , thus will take time

        return {accessToken , refreshToken}

    } 
    catch (error){
        throw new ApiError(500,"Something went wrong while generating access and refresh token")
    }
}
// this method will register the user
const registerUser = asyncHandler( async (req,res) => {
    // 1) get user details from frontend
    // 2) validation ( empty email ? , empty username ?) for eg: not empty
    // 3) check if user already exists: username , email
    // 4) check for images, check for avatar
    // 5) upload them to cloudinary, check for avatar also
    // 6) create user object - create entry in db
    // 7) remove password and refesh token field from response
    // 8) check for user creation
    // 9) return res

     const {fullname,email,username,password} = req.body
     console.log("email: ",email);

    //  if(fullname === ""){
    //     throw new ApiError(400, "fullname is required")
    //  }
    //We can do the same thing as above for other fields 
    // also but below is the better way

    if(
        [fullname , email , username , password].some((field) => 
            field?.trim() === "")
    ) {
        throw new ApiError(400,"All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username },{ email }]
    })

    if (existedUser){
        throw new ApiError(409, "User with email or username already exits") 
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(499, " Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",

        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    
    )
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})

const loginUser = asyncHandler(async (req,res) => {
    // 1) ask for username (req body -> data)
    // 2) validate if the username exists in database
    // 3) if it exists , ask for password
    // 4) check if the password is correct 
    // 5) if password correct , send access and refresh tokens to the user
    // 6) send these tokens as secure cookies 

    const {email,username,password} = req.body

    if(!username && !email){
        throw new ApiError(400 , "username or email required")
    }

    const user = await User.findOne({
        $or: [{username} , {email}] // ya to username ya fir email ke basis pe dekh lo
    })

    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    const isPassValid = await user.isPasswordCorrect(password)

    if(!isPassValid){
        throw new ApiError(401,"Invalid User Credentials")
    }

    const {accessToken , refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    const options = {// cookies bhejne ke lie
        httpOnly: true,
        secure: true

        // now the cookies are modifiable only through the server,
        // ca't be modified via frontend
    }

    return res.status(200).
    cookie("accessToken", accessToken , options).
    cookie("refreshToken",refreshToken,options).
    json(
        new ApiResponse(
            200,
            {
                user: loggedInUser , accessToken , 
                refreshToken
            },
            "User logged in Succesfully"
        )
    )
})

const logoutUser = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    // Jo options cookie set karte wakt the wahi 
    // cookie clear karte wakt bhi hone chahie
    return res.
    status(200).
    clearCookie("accessToken",options).
    clearCookie("refreshToken",options).
    json(new ApiResponse(200,{},"User logged out"))
})


export { registerUser, loginUser , logoutUser}