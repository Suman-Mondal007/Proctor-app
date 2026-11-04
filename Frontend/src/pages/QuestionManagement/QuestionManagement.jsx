import {
    useState
} from "react";


import "./QuestionManagement.css";



function QuestionManagement(){


const [questions,setQuestions]=useState([


{

id:1,

question:"Which data structure uses FIFO?",

category:"DSA",

difficulty:"Easy",

marks:5

},


{

id:2,

question:"What is React?",

category:"Frontend",

difficulty:"Medium",

marks:10

}



]);





const [form,setForm]=useState({


question:"",

category:"",

difficulty:"",

marks:""


});








const handleChange=(e)=>{


setForm({

...form,

[e.target.name]:e.target.value


});


};









const addQuestion=()=>{


if(!form.question)

return;



const newQuestion={


id:Date.now(),


...form,


marks:Number(form.marks)


};



setQuestions([

...questions,

newQuestion

]);





setForm({

question:"",

category:"",

difficulty:"",

marks:""


});



};









const deleteQuestion=(id)=>{


setQuestions(

questions.filter(

(q)=>q.id!==id

)

);


};







return(



<div className="question-page">



<h1>

Question Management

</h1>







<div className="add-box">


<h2>

Add New Question

</h2>



<input


name="question"


placeholder="Enter question"


value={form.question}


onChange={handleChange}


/>







<select

name="category"

value={form.category}

onChange={handleChange}

>


<option>

Select Category

</option>


<option>

Java

</option>


<option>

React

</option>


<option>

DSA

</option>


<option>

Database

</option>


</select>








<select

name="difficulty"

value={form.difficulty}

onChange={handleChange}

>


<option>

Difficulty

</option>


<option>

Easy

</option>


<option>

Medium

</option>


<option>

Hard

</option>


</select>







<input

type="number"

name="marks"

placeholder="Marks"

value={form.marks}

onChange={handleChange}

/>







<button

onClick={addQuestion}

>

Add Question

</button>



</div>










<div className="question-list">


<h2>

Question Bank

</h2>




{

questions.map((item)=>(



<div

className="question-card"

key={item.id}

>



<h3>

{item.question}

</h3>



<p>

Category:
{item.category}

</p>


<p>

Difficulty:
{item.difficulty}

</p>


<p>

Marks:
{item.marks}

</p>





<button

className="delete"

onClick={()=>deleteQuestion(item.id)}

>

Delete

</button>




</div>



))


}



</div>







</div>



);


}



export default QuestionManagement;