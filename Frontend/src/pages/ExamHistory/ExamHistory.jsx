import "./ExamHistory.css";


function ExamHistory(){



const exams=[


{

name:"Java Assessment",

date:"12 July 2026",

score:"85%",

status:"Passed"

},


{

name:"React Assessment",

date:"15 July 2026",

score:"72%",

status:"Passed"

},


{

name:"DSA Assessment",

date:"18 July 2026",

score:"45%",

status:"Failed"

}



];





return(


<div className="history-page">


<h1>

Exam History

</h1>





<div className="history-table">


<table>


<thead>

<tr>

<th>
Exam
</th>


<th>
Date
</th>


<th>
Score
</th>


<th>
Status
</th>


<th>
Report
</th>


</tr>


</thead>





<tbody>


{

exams.map((exam,index)=>(


<tr key={index}>


<td>

{exam.name}

</td>



<td>

{exam.date}

</td>



<td>

{exam.score}

</td>



<td>

<span

className={

exam.status==="Passed"

?

"passed"

:

"failed"

}

>

{exam.status}

</span>


</td>



<td>


<button>

View

</button>


</td>



</tr>


))


}



</tbody>


</table>



</div>




</div>


);



}


export default ExamHistory;