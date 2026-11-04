import Exam from "../models/Exam.js";
import mongoose from "mongoose";



// ==============================
// CREATE EXAM
// ==============================

export const createExam = async(req,res)=>{

    try{


        const exam = await Exam.create(req.body);


        res.status(201).json({

            success:true,

            exam

        });


    }

    catch(error){


        res.status(500).json({

            success:false,

            message:error.message

        });


    }

};





// ==============================
// GET ALL EXAMS
// ==============================

export const getAllExams = async(req,res)=>{


    try{


        const exams = await Exam.find()

        .populate(
            "questions"
        )

        .sort({

            createdAt:-1

        });



        res.status(200).json(exams);



    }

    catch(error){


        res.status(500).json({

            success:false,

            message:error.message

        });


    }


};







// ==============================
// GET SINGLE EXAM
// ==============================


export const getExamById = async(req,res)=>{


    try{


        const id = req.params.id;



        // Check ObjectId

        if(!mongoose.Types.ObjectId.isValid(id)){


            return res.status(400).json({

                message:"Invalid Exam ID"

            });


        }





        const exam = await Exam.findById(id)

        .populate(
            "questions"
        );





        if(!exam){


            return res.status(404).json({

                message:"Exam not found"

            });


        }




        res.status(200).json(exam);



    }


    catch(error){


        res.status(500).json({

            message:error.message

        });


    }


};