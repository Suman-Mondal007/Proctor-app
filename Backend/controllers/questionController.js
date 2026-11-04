import Question from "../models/Question.js";



// CREATE QUESTION

export const createQuestion = async(req,res)=>{


try{


const question =
await Question.create(req.body);



res.status(201).json({

message:"Question created",

question

});


}

catch(error){


res.status(500).json({

message:error.message

});


}


};







// GET ALL QUESTIONS

export const getQuestions = async(req,res)=>{


try{


const questions =
await Question.find();



res.json(questions);


}

catch(error){


res.status(500).json({

message:error.message

});


}



};







// GET SINGLE QUESTION

export const getQuestionById =
async(req,res)=>{


try{


const question =
await Question.findById(
req.params.id
);



res.json(question);



}

catch(error){


res.status(500).json({

message:error.message

});


}


};







// UPDATE QUESTION


export const updateQuestion =
async(req,res)=>{


try{


const question =
await Question.findByIdAndUpdate(

req.params.id,

req.body,

{
new:true
}

);



res.json({

message:"Updated",

question

});


}

catch(error){


res.status(500).json({

message:error.message

});


}



};







// DELETE QUESTION


export const deleteQuestion =
async(req,res)=>{


try{


await Question.findByIdAndDelete(

req.params.id

);



res.json({

message:"Question deleted"

});


}


catch(error){


res.status(500).json({

message:error.message

});


}



};