import mongoose , {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema(
    {
        videoFile: {
            type: String, // cloudinary url
            required: true
        },
        thumbnail: {
            type: String, // cloudinary url
            required: true
        },
        title: {
            type: String, 
            required: true
        },
        description: {
            type: String, 
            required: true
        },
        duration: {
            type: Number, // cloudinary
            required: true
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            deafult: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },

    {
        timestamps: true
    }
)

//Mongoose Aggregation Pipeline
videoSchema.plugin(mongooseAggregatePaginate)
// Now we can write aggregation queries
export const Video = mongoose.model("Video",videoSchema)