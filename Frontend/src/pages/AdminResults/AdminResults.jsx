import {
useEffect,
useState
}
from "react";


import API from "../../services/api";


import "./AdminResults.css";




function AdminResults(){



const [results,setResults]=useState([]);






const fetchResults=async()=>{


try{


const response =
await API.get(
"/results"
);



setResults(
response.data
);



}

catch(error){


console.log(error);


}



};







useEffect(()=>{


fetchResults();


},[]);








return(


<div className="admin-results">





<h1>

Candidate Results

</h1>








<table>



<thead>


<tr>


<th>
Candidate
</th>


<th>
Email
</th>


<th>
Score
</th>


<th>
Percentage
</th>


<th>
Status
</th>


<th>
Violations
</th>


</tr>


</thead>






<tbody>



{

results.map((result)=>(


<tr

key={result._id}

>


<td>

{

result.candidate?.name

}


</td>



<td>

{

result.candidate?.email

}

</td>





<td>

{

result.score

}

/

{

result.totalQuestions

}


</td>





<td>

{

result.percentage

}%

</td>





<td>


<span

className={

result.status==="PASS"

?

"pass"

:

"fail"

}

>


{

result.status

}


</span>



</td>





<td>

{

result.violations.length

}


</td>



</tr>



))


}



</tbody>





</table>





</div>


);


}



export default AdminResults;