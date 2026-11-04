import mongoose from "mongoose";


const questionSchema = new mongoose.Schema({

    question:{
        type:String,
        required:true
    },


    options:[

        {
            type:String
        }

    ],


    correctAnswer:{
        type:String,
        required:true
    },


    category:{
        type:String,
        default:"Technical"
    },


    difficulty:{
        type:String,
        enum:[
            "Easy",
            "Medium",
            "Hard"
        ],
        default:"Medium"
    },


    createdAt:{
        type:Date,
        default:Date.now
    }


});



const Question =
mongoose.model(
"Question",
questionSchema
);



export default Question;