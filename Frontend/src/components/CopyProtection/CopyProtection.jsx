import { useEffect } from "react";


import {
useViolation
}
from "../../context/ViolationContext";





function CopyProtection(){


const {
addViolation
}=useViolation();




useEffect(()=>{



const blockCopy=(e)=>{


e.preventDefault();


addViolation(

"COPY",

"Copy action detected",

"MEDIUM"

);


};







const blockPaste=(e)=>{


e.preventDefault();


addViolation(

"PASTE",

"Paste action detected",

"MEDIUM"

);


};







const blockCut=(e)=>{


e.preventDefault();


addViolation(

"CUT",

"Cut action detected",

"MEDIUM"

);


};







const blockRightClick=(e)=>{


e.preventDefault();


addViolation(

"RIGHT_CLICK",

"Right click detected",

"LOW"

);


};







const keyboardCheck=(e)=>{



if(

e.ctrlKey &&

(

e.key==="c" ||

e.key==="v" ||

e.key==="x"

)

)

{


e.preventDefault();



addViolation(

"KEYBOARD_SHORTCUT",

"Restricted keyboard shortcut used",

"MEDIUM"

);


}






if(

e.key==="F12"

)

{


e.preventDefault();


addViolation(

"DEVTOOLS",

"Developer tools shortcut detected",

"HIGH"

);


}





};









document.addEventListener(

"copy",

blockCopy

);



document.addEventListener(

"paste",

blockPaste

);



document.addEventListener(

"cut",

blockCut

);



document.addEventListener(

"contextmenu",

blockRightClick

);



document.addEventListener(

"keydown",

keyboardCheck

);








return()=>{


document.removeEventListener(

"copy",

blockCopy

);



document.removeEventListener(

"paste",

blockPaste

);



document.removeEventListener(

"cut",

blockCut

);



document.removeEventListener(

"contextmenu",

blockRightClick

);



document.removeEventListener(

"keydown",

keyboardCheck

);


};





},[]);





return null;



}


export default CopyProtection;