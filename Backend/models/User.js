import mongoose from "mongoose";


const userSchema = new mongoose.Schema({

    // Existing fields
    name:{
        type:String,
        required:true
    },


    email:{
        type:String,
        required:true,
        unique:true
    },


    password:{
        type:String,
        required:true
    },


    role:{
        type:String,
        enum:["candidate","admin"],
        default:"candidate"
    },


    // ==============================
    // NEW PROFILE INFORMATION FIELDS
    // ==============================


    phone:{
        type:String,
        default:""
    },


    altPhone:{
        type:String,
        default:""
    },


    dob:{
        type:Date,
        default:null
    },


    gender:{
        type:String,
        enum:[
            "Male",
            "Female",
            "Other"
        ],
        default:"Male"
    },


    address:{
        type:String,
        default:""
    },


    district:{
        type:String,
        default:""
    },


    state:{
        type:String,
        default:""
    },


    country:{
        type:String,
        default:"India"
    },


    pincode:{
        type:String,
        default:""
    },


    // ==============================
    // PROFILE IMAGE STORAGE
    // ==============================


    photoUrl:{
        type:String,
        default:""
    },


    // Optional avatar support
    avatar:{
        type:String,
        default:""
    },


    createdAt:{
        type:Date,
        default:Date.now
    }


},
{
    timestamps:true
});



const User = mongoose.model(
    "User",
    userSchema
);


export default User;