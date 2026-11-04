import {
useEffect
}
from "react";


import {
useViolation
}
from "../../context/ViolationContext";



function FullscreenDetection(){


const {
addViolation
}=useViolation();





useEffect(()=>{


const check=()=>{


if(!document.fullscreenElement){


addViolation(

"FULLSCREEN_EXIT",

"Candidate exited fullscreen mode",

"MEDIUM"

);


}



};



document.addEventListener(

"fullscreenchange",

check

);



return()=>{


document.removeEventListener(

"fullscreenchange",

check

);


};



},[]);




return null;


}


export default FullscreenDetection;