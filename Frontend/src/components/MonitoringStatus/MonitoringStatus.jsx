import "./MonitoringStatus.css";

import {
    FaCamera,
    FaMicrophone,
    FaExpand,
    FaShieldAlt
} from "react-icons/fa";


function MonitoringStatus({

cameraActive=true,

micActive=true,

fullscreen=true,

violations=0

}){


return(


<div className="monitor-status">


<div className="status-item">

<FaCamera/>

<span>
Camera
</span>


<strong className={
cameraActive
?
"active"
:
"inactive"
}>


{
cameraActive
?
"Active"
:
"Off"
}


</strong>


</div>





<div className="status-item">

<FaMicrophone/>

<span>
Microphone
</span>


<strong className={
micActive
?
"active"
:
"inactive"
}>


{
micActive
?
"Active"
:
"Off"
}


</strong>


</div>







<div className="status-item">

<FaExpand/>

<span>
Fullscreen
</span>


<strong className={
fullscreen
?
"active"
:
"inactive"
}>


{
fullscreen
?
"Enabled"
:
"Exited"
}


</strong>


</div>







<div className="status-item">


<FaShieldAlt/>


<span>
Violations
</span>


<strong className="warning-count">

{violations}

</strong>


</div>



</div>


);


}


export default MonitoringStatus;