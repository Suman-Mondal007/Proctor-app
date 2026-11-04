import express from "express";


import {

createQuestion,

getQuestions,

getQuestionById,

updateQuestion,

deleteQuestion


}

from "../controllers/questionController.js";



const router =
express.Router();




// Admin create

router.post(
"/",
createQuestion
);




// Get all

router.get(
"/",
getQuestions
);




// Single

router.get(
"/:id",
getQuestionById
);




// Update

router.put(
"/:id",
updateQuestion
);




// Delete

router.delete(
"/:id",
deleteQuestion
);



export default router;