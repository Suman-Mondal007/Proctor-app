import "./Profile.css";

import { useNavigate } from "react-router-dom";


function Profile(){


const navigate = useNavigate();



const user={


name:"John Doe",

email:"john@gmail.com",

role:"Software Developer",

experience:"Fresher",

skills:[

"Java",

"React",

"Node.js",

"MongoDB"

]


};





return(


<div className="profile-page">



<div className="profile-card">


<div className="profile-image">

👤

</div>




<h1>

{user.name}

</h1>


<p>

{user.email}

</p>



<div className="profile-info">


<div>

<h3>
Role
</h3>

<p>
{user.role}
</p>

</div>



<div>

<h3>
Experience
</h3>

<p>
{user.experience}
</p>

</div>



</div>






<h2>
Skills
</h2>


<div className="skills">


{

user.skills.map((skill,index)=>(


<span key={index}>

{skill}

</span>


))


}


</div>





<button

onClick={()=>navigate("/history")}

>

View Exam History

</button>



</div>



</div>


);


}


export default Profile;