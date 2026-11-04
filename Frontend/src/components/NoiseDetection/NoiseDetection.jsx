import {
    useEffect,
    useRef,
    useState
}
from "react";


import "./NoiseDetection.css";



function NoiseDetection({

    onNoise

}){


const audioContext =
useRef(null);


const analyser =
useRef(null);


const noiseTimer =
useRef(null);



const warningCooldown =
useRef(false);



const [status,setStatus]=useState(
"Checking microphone..."
);







useEffect(()=>{


startMicrophone();



return()=>{


if(audioContext.current){

audioContext.current.close();

}


clearTimeout(
noiseTimer.current
);


}


},[]);










const startMicrophone=async()=>{


try{


const stream =

await navigator.mediaDevices.getUserMedia({

audio:true

});






audioContext.current =

new AudioContext();






const source =

audioContext.current.createMediaStreamSource(

stream

);







analyser.current =

audioContext.current.createAnalyser();



analyser.current.fftSize=256;






source.connect(

analyser.current

);





setStatus(
"Microphone Monitoring Active"
);





detectNoise();



}

catch(error){


console.log(
"Mic Error",
error
);


setStatus(
"Microphone Error"
);


}



};









const detectNoise=()=>{


const dataArray =

new Uint8Array(

analyser.current.frequencyBinCount

);






const checkVolume=()=>{



analyser.current.getByteFrequencyData(

dataArray

);





let volume =0;



for(let i=0;i<dataArray.length;i++){


volume += dataArray[i];


}



volume =
volume/dataArray.length;






console.log(
"Noise:",
volume
);







if(volume > 45){


setStatus(
"High Noise Detected"
);



startNoiseTimer();



}

else{


setStatus(
"Normal Noise"
);



clearNoiseTimer();



}






requestAnimationFrame(

checkVolume

);



};




checkVolume();



};









const startNoiseTimer=()=>{


if(noiseTimer.current)

return;






noiseTimer.current =

setTimeout(()=>{


sendWarning(

"High background noise detected"

);



noiseTimer.current=null;



},3000);



};









const clearNoiseTimer=()=>{


if(noiseTimer.current){


clearTimeout(

noiseTimer.current

);


noiseTimer.current=null;


}



};









const sendWarning=(message)=>{


if(warningCooldown.current)

return;





warningCooldown.current=true;





onNoise?.(message);





setTimeout(()=>{


warningCooldown.current=false;



},5000);



};









return(

<div className="noise-status">


<h4>
Audio Monitoring
</h4>


<p>
{status}
</p>


</div>


);



}



export default NoiseDetection;