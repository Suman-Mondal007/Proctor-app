import {
useEffect,
useState
}
from "react";


function useFullscreen(){


const [fullscreen,setFullscreen]=useState(true);



useEffect(()=>{


const checkFullscreen=()=>{


if(!document.fullscreenElement)

{

setFullscreen(false);


}

else{


setFullscreen(true);

}


};



document.addEventListener(

"fullscreenchange",

checkFullscreen

);



return()=>{


document.removeEventListener(

"fullscreenchange",

checkFullscreen

);


};



},[]);



return fullscreen;


}


export default useFullscreen;