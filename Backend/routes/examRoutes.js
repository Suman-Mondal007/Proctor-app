import express from "express";

import {
createExam,
getAllExams,
getExamById
}
from "../controllers/examController.js";


const router = express.Router();



// Test route
router.get("/test",(req,res)=>{

    res.json({
        message:"Exam route working"
    });

});



// Create Exam
router.post(
"/",
createExam
);



// Get All Exams
router.get(
"/",
getAllExams
);



// Get Single Exam
router.get(
"/:id",
getExamById
);



export default router;