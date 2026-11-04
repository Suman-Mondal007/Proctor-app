import {
    useEffect,
    useRef
} from "react";


import "./TabDetection.css";



function TabDetection({

    onViolation

}) {



const violationCooldown = useRef(false);




useEffect(()=>{



const handleVisibilityChange =()=>{


if(document.hidden){


sendViolation(
"Tab switching detected"
);


}



};






const handleBlur =()=>{


sendViolation(
"Browser window changed"
);


};






document.addEventListener(

"visibilitychange",

handleVisibilityChange

);





window.addEventListener(

"blur",

handleBlur

);







return()=>{


document.removeEventListener(

"visibilitychange",

handleVisibilityChange

);



window.removeEventListener(

"blur",

handleBlur

);



};



},[]);







const sendViolation=(message)=>{


if(violationCooldown.current)

return;





violationCooldown.current=true;





if(onViolation){

onViolation(message);

}





// cooldown 5 seconds


setTimeout(()=>{


violationCooldown.current=false;



},5000);



};






return null;



}



export default TabDetection;