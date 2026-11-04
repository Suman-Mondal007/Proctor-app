import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({

    candidate:{

        type:mongoose.Schema.Types.ObjectId,

        ref:"User",

        required:true

    },

    score:{

        type:Number,

        default:0

    },

    totalQuestions:{

        type:Number,

        required:true

    },

    percentage:{

        type:Number,

        default:0

    },

    answers:[

        {

            questionId:String,

            selectedAnswer:String,

            correctAnswer:String,

            isCorrect:Boolean

        }

    ],

    // violations:[

    //     {

    //         type:String,

    //         message:String,

    //         timestamp:{

    //             type:Date,

    //             default:Date.now

    //         }

    //     }

    // ],
    violations:[

    {

        type:{
            type:String
        },

        message:{
            type:String
        },

        timestamp:{
            type:Date,
            default:Date.now
        }

    }

],

    duration:Number,

    status:{

        type:String,

        enum:["PASS","FAIL"],

        default:"FAIL"

    },

    submittedAt:{

        type:Date,

        default:Date.now

    }

});

export default mongoose.model("Result",resultSchema);