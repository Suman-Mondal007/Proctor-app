import express from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import User from "../models/User.js";

import { getUsers } from "../controllers/userController.js";


const router = express.Router();



// ======================================
// MULTER CONFIGURATION
// ======================================

const storage = multer.memoryStorage();


const upload = multer({

  storage,

  limits:{
    fileSize:5 * 1024 * 1024
  }

});




// ======================================
// GET /api/users
// Test Route
// ======================================

router.get("/",(req,res)=>{

  res.json({

    message:"Users route working"

  });

});





// ======================================
// GET ALL USERS
// Admin Analytics
// ======================================

router.get(
  "/all",
  getUsers
);







// ======================================
// GET USER PROFILE
// Used after login to restore latest data
// ======================================

router.get(
  "/profile/:id",
  async(req,res)=>{


    try{


      const {id}=req.params;



      const user =
      await User.findById(id)
      .select("-password");



      if(!user){


        return res.status(404).json({

          message:"User not found"

        });


      }




      res.status(200).json({

        success:true,

        user

      });



    }
    catch(error){


      console.error(
        "Get profile error:",
        error
      );


      res.status(500).json({

        message:"Failed to fetch profile",

        error:error.message

      });


    }


  }
);









// ======================================
// UPDATE USER PROFILE
// ======================================

router.put(
"/profile",
upload.single("photo"),
async(req,res)=>{


try{


const {

userId,
name,
email,
phone,
altPhone,
dob,
gender,
address,
district,
state,
country,
pincode

}=req.body;




const targetId =
userId || req.user?._id;



if(!targetId){


return res.status(400).json({

message:"User ID is required"

});


}




const updateData={

name,
email,
phone,
altPhone,
dob,
gender,
address,
district,
state,
country,
pincode

};





// Upload profile photo

if(req.file){


const base64Image =
`data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;



updateData.photo =
base64Image;


updateData.photoUrl =
base64Image;


}






// Remove undefined values

Object.keys(updateData)
.forEach(
(key)=>{

if(updateData[key]===undefined){

delete updateData[key];

}

}

);







const updatedUser =
await User.findByIdAndUpdate(

targetId,

updateData,

{

new:true,

runValidators:true

}

)
.select("-password");







if(!updatedUser){


return res.status(404).json({

message:"User not found"

});


}





res.status(200).json({

success:true,

message:"Profile updated successfully",

user:updatedUser

});





}
catch(error){


console.error(
"Update profile error:",
error
);


res.status(500).json({

message:"Failed to update profile",

error:error.message

});


}


});









// ======================================
// CHANGE PASSWORD
// ======================================


router.put(
"/change-password",
async(req,res)=>{


try{


const {

userId,

currentPassword,

newPassword

}=req.body;




const targetId =
userId || req.user?._id;




if(
!targetId ||
!currentPassword ||
!newPassword
){


return res.status(400).json({

message:"All fields are required"

});


}






const user =
await User.findById(targetId);



if(!user){


return res.status(404).json({

message:"User not found"

});


}






const isMatch =
await bcrypt.compare(
currentPassword,
user.password
);




if(!isMatch){


return res.status(400).json({

message:"Incorrect current password"

});


}






const salt =
await bcrypt.genSalt(10);



user.password =
await bcrypt.hash(
newPassword,
salt
);



await user.save();






res.status(200).json({

message:"Password updated successfully"

});




}
catch(error){


console.error(
"Change password error:",
error
);



res.status(500).json({

message:"Failed to change password",

error:error.message

});


}


});





export default router;