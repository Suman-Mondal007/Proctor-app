import mongoose from "mongoose";

const examSchema = new mongoose.Schema(

{

title:{

type:String,

required:true

},

description:{

type:String,

default:""

},

duration:{

type:Number,

required:true

},

totalMarks:{

type:Number,

default:0

},

passingMarks:{

type:Number,

default:0

},

questions:[

{

type:mongoose.Schema.Types.ObjectId,

ref:"Question"

}

],

status:{

type:String,

enum:["active","inactive"],

default:"active"

},

createdBy:{

type:mongoose.Schema.Types.ObjectId,

ref:"User"

},

createdAt:{

type:Date,

default:Date.now

}

}

);

export default mongoose.model("Exam",examSchema);