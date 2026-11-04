import User from "../models/User.js";

import bcrypt from "bcrypt";

import jwt from "jsonwebtoken";




// ===============================
// Register Candidate
// ===============================

export const register = async(req,res)=>{


try{


const {

name,

email,

password

}=req.body;




const existingUser = await User.findOne({

email

});



if(existingUser){

return res.status(400).json({

message:"User already exists"

});

}




const hashedPassword = await bcrypt.hash(

password,

10

);





const user = await User.create({

name,

email,

password:hashedPassword,

role:"candidate"

});





res.status(201).json({

message:"Registration successful",

user

});



}


catch(error){


res.status(500).json({

message:error.message

});


}



};









// ===============================
// Login
// ===============================


export const login = async(req,res)=>{


try{


const {

email,

password

}=req.body;





const user = await User.findOne({

email

});





if(!user){


return res.status(404).json({

message:"User not found"

});


}





const match = await bcrypt.compare(

password,

user.password

);





if(!match){


return res.status(400).json({

message:"Invalid password"

});


}







const token = jwt.sign(

{


id:user._id,


role:user.role


},


process.env.JWT_SECRET,


{


expiresIn:"1d"


}


);







res.json({


message:"Login successful",



token,



user:{


_id:user._id,


name:user.name,


email:user.email,


role:user.role


}



});



}


catch(error){


res.status(500).json({

message:error.message

});


}



};