import { useEffect, useState } from "react";
import { FaClock } from "react-icons/fa";

import "./Timer.css";


function Timer({

    initialTime = 3600,

    onTimeUp

}) {


const [time,setTime] = useState(initialTime);



useEffect(()=>{


const timer = setInterval(()=>{


setTime((previous)=>{


if(previous <= 1){

clearInterval(timer);


if(onTimeUp){

onTimeUp();

}


return 0;

}


return previous - 1;


});


},1000);



return ()=>clearInterval(timer);



},[onTimeUp]);





const formatTime = (seconds)=>{


const hours = Math.floor(seconds / 3600);


const minutes = Math.floor(
(seconds % 3600) / 60
);


const secs = seconds % 60;



return {


hours:String(hours).padStart(2,"0"),


minutes:String(minutes).padStart(2,"0"),


seconds:String(secs).padStart(2,"0")

};


};




const {

hours,

minutes,

seconds

}=formatTime(time);





const warning = time <=300;



return (

<div

className={
warning
?
"timer warning"
:
"timer"
}

>


<FaClock/>


<div>

<span>

{hours}

</span>

:

<span>

{minutes}

</span>

:

<span>

{seconds}

</span>


</div>



</div>

);


}


export default Timer;