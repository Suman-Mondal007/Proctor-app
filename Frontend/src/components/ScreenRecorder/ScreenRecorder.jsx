import { useEffect, useRef } from "react";


function ScreenRecorder({onRecordingComplete}){


const mediaRecorder = useRef(null);

const recordedChunks = useRef([]);



useEffect(()=>{


startRecording();



return()=>{

stopRecording();

}


},[]);





const startRecording = async()=>{


try{


const stream =
await navigator.mediaDevices.getDisplayMedia({

video:true,

audio:true

});



recordedChunks.current=[];



mediaRecorder.current =
new MediaRecorder(stream);



mediaRecorder.current.ondataavailable=(event)=>{


if(event.data.size>0){

recordedChunks.current.push(event.data);

}


};





mediaRecorder.current.onstop=()=>{


const blob=new Blob(

recordedChunks.current,

{
type:"video/webm"
}

);



if(onRecordingComplete){

onRecordingComplete(blob);

}


};




mediaRecorder.current.start();



}


catch(error){

console.log(error);

}


};






const stopRecording=()=>{


if(mediaRecorder.current){


mediaRecorder.current.stop();



mediaRecorder.current.stream
.getTracks()
.forEach(track=>track.stop());


}



};




return null;


}


export default ScreenRecorder;