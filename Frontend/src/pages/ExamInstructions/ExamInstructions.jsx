import {
    useState,
    useEffect
} from "react";


import {
    FaCamera,
    FaMicrophone,
    FaExpand,
    FaCheckCircle
} from "react-icons/fa";


import {
    useNavigate
} from "react-router-dom";


import "./ExamInstructions.css";



function ExamInstructions(){


const navigate = useNavigate();


const [camera,setCamera]=useState(false);

const [mic,setMic]=useState(false);

const [fullscreen,setFullscreen]=useState(false);

const [accepted,setAccepted]=useState(false);





// Camera + Microphone Check

useEffect(()=>{


navigator.mediaDevices
.getUserMedia({

video:true,

audio:true

})

.then(()=>{


setCamera(true);

setMic(true);


})

.catch(()=>{


setCamera(false);

setMic(false);


});



},[]);









const enterFullscreen=()=>{


document.documentElement.requestFullscreen();


setFullscreen(true);


};







const startExam=()=>{


if(

camera &&

mic &&

accepted

)

{


navigate("/exam");


}



};






return(



<div className="instruction-page">





<div className="instruction-card">



<h1>

Technical Assessment

</h1>



<p className="subtitle">

System Verification Required

</p>







<div className="rules">


<h2>

Exam Instructions

</h2>


<ul>


<li>
Do not switch browser tabs
</li>


<li>
Keep your face visible
</li>


<li>
Do not use mobile devices
</li>


<li>
Ensure stable internet connection
</li>


<li>
Exam will be recorded for monitoring
</li>


</ul>


</div>







<div className="system-check">



<h2>
System Check
</h2>





<div className="check-item">


<FaCamera/>


Camera


{

camera ?

<FaCheckCircle className="success"/>

:

<span className="fail">

Failed

</span>

}



</div>







<div className="check-item">


<FaMicrophone/>


Microphone


{

mic ?

<FaCheckCircle className="success"/>

:

<span className="fail">

Failed

</span>

}



</div>







<div className="check-item">


<FaExpand/>


Fullscreen


{

fullscreen ?

<FaCheckCircle className="success"/>

:

<button

onClick={enterFullscreen}

>

Enable

</button>

}



</div>



</div>








<label className="agree">


<input

type="checkbox"

checked={accepted}

onChange={
e=>setAccepted(e.target.checked)
}


/>

I agree to the exam rules


</label>








<button


className="start-btn"


disabled={

!(camera && mic && accepted)

}


onClick={startExam}


>


Start Exam


</button>





</div>




</div>


);


}


export default ExamInstructions;