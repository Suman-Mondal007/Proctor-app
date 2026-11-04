import Result from "../models/Result.js";
import Question from "../models/Question.js";



// ==========================
// Get All Results (Admin)
// ==========================

export const getAllResults = async (req, res) => {

    try {

        const results = await Result.find()

            .populate(
                "candidate",
                "name email"
            )

            .sort({
                submittedAt: -1
            });

        res.json(results);

    } catch (error) {

        res.status(500).json({

            message: error.message

        });

    }

};



// ==========================
// Submit Exam Result
// ==========================

// export const submitResult = async (req, res) => {

//     try {

//         const {
//             candidate,
//             answers,
//             violations,
//             duration
//         } = req.body;



//         const questions = await Question.find();



//         let score = 0;

//         const finalAnswers = [];



//         questions.forEach((question) => {

//             const selected = answers.find(

//                 (a) => a.questionId === question._id.toString()

//             );



//             const isCorrect =
//                 selected?.selectedAnswer === question.correctAnswer;



//             if (isCorrect) {

//                 score++;

//             }



//             finalAnswers.push({

//                 questionId: question._id,

//                 selectedAnswer:
//                     selected?.selectedAnswer || "",

//                 correctAnswer:
//                     question.correctAnswer,

//                 isCorrect

//             });

//         });




//         const percentage =

//             questions.length > 0

//                 ? (score / questions.length) * 100

//                 : 0;



//         const status =

//             percentage >= 40

//                 ? "PASS"

//                 : "FAIL";




//         const result = await Result.create({

//             candidate,

//             score,

//             totalQuestions: questions.length,

//             percentage,

//             answers: finalAnswers,

//             violations,

//             duration,

//             status

//         });




//         res.status(201).json(result);

//     } catch (error) {

//         res.status(500).json({

//             message: error.message

//         });

//     }

// };
export const submitResult = async(req,res)=>{

try{


const {

candidate,

answers,

violations,

duration

}=req.body;



if(!candidate){

return res.status(400).json({

message:"Candidate missing"

});

}




let score = 0;



const finalAnswers = [];





for(const answer of answers){



const question = await Question.findById(

answer.questionId

);



if(!question){

continue;

}





const isCorrect =

answer.selectedAnswer === question.correctAnswer;





if(isCorrect){

score++;

}




finalAnswers.push({


questionId:question._id,


selectedAnswer:
answer.selectedAnswer,


correctAnswer:
question.correctAnswer,


isCorrect


});



}






const totalQuestions = finalAnswers.length;



const percentage =

totalQuestions > 0

?

(score / totalQuestions) * 100

:

0;





const status =

percentage >= 40

?

"PASS"

:

"FAIL";







const result = await Result.create({


candidate,


score,


totalQuestions,


percentage,


answers:finalAnswers,


violations,


duration,


status


});






res.status(201).json({

success:true,

message:"Result submitted successfully",

result

});



}

catch(error){


console.log(error);


res.status(500).json({

message:error.message

});


}


};


// ==========================
// Get Candidate Results
// ==========================

export const getCandidateResults = async (req, res) => {

    try {

        const results = await Result.find({

            candidate: req.params.id

        })

        .sort({

            submittedAt: -1

        });

        res.json(results);

    } catch (error) {

        res.status(500).json({

            message: error.message

        });

    }

};


// ==========================
// Delete Result
// ==========================

export const deleteResult = async (req, res) => {
    try {

        const { id } = req.params;

        const result = await Result.findById(id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Result not found"
            });
        }

        await Result.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Exam history deleted successfully"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


// ==========================
// Get Result Details
// ==========================

export const getResultDetails = async (req, res) => {

    try {

        const result = await Result.findById(

            req.params.id

        )

        .populate(

            "candidate",

            "name email"

        );



        if (!result) {

            return res.status(404).json({

                message: "Result not found"

            });

        }



        res.json(result);

    } catch (error) {

        res.status(500).json({

            message: error.message

        });

    }

};