import {
useViolation
}
from "../../context/ViolationContext";


import "./ViolationList.css";



function ViolationList(){


const {
violations
}=useViolation();




return(

<div className="violation-box">


<h3>
Violations
</h3>



{
violations.length===0

?

<p>
No violations
</p>


:


violations.map((item)=>(


<div

className="violation-item"

key={item.id}

>


<p>

{item.type}

</p>


<span>

{item.time}

</span>



<strong>

{item.severity}

</strong>



</div>


))


}



</div>

);


}


export default ViolationList;