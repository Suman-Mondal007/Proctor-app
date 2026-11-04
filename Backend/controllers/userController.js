import User from "../models/User.js";


// =====================================
// GET ALL USERS (Existing Feature)
// =====================================

export const getUsers = async (req, res) => {

    try {

        const users = await User.find();

        res.status(200).json(users);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};



// =====================================
// GET SINGLE USER PROFILE
// Used after login to get latest MongoDB data
// =====================================

export const getUserProfile = async (req, res) => {

    try {

        const { id } = req.params;


        const user = await User.findById(id)
            .select("-password");


        if (!user) {

            return res.status(404).json({

                message:"User not found"

            });

        }


        res.status(200).json({

            success:true,
            user

        });



    } catch(error){


        res.status(500).json({

            message:error.message

        });


    }

};




// =====================================
// UPDATE USER PROFILE
// Stores phone, address, image etc permanently
// =====================================

export const updateProfile = async(req,res)=>{


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

        } = req.body;



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



        // If image uploaded
        if(req.file){


            updateData.photoUrl =
            `/uploads/${req.file.filename}`;


        }




        const updatedUser = await User.findByIdAndUpdate(

            userId,

            updateData,

            {
                new:true,
                runValidators:true
            }

        ).select("-password");





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


        console.log("Profile update error:",error);


        res.status(500).json({

            message:error.message

        });


    }


};





// =====================================
// CHANGE PASSWORD
// Keep your existing password logic here
// =====================================

// Add your existing changePassword controller below