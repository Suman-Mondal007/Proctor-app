import "./QuestionPalette.css";


function QuestionPalette({

questions,

currentQuestion,

setCurrentQuestion,

answers

}){


return(


<div className="palette">


<h3>
Questions
</h3>



<div className="numbers">


{

questions.map((q,index)=>(


<button


key={index}


className={


currentQuestion===index

?

"active"

:

answers[index]

?

"answered"

:

""


}



onClick={()=>setCurrentQuestion(index)}



>


{index+1}


</button>



))


}


</div>


</div>



);


}


export default QuestionPalette;