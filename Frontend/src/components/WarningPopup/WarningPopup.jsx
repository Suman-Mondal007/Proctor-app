import { 
    FaExclamationTriangle,
    FaTimes,
    FaCheckCircle,
    FaBan
} from "react-icons/fa";


import "./WarningPopup.css";


function WarningPopup({

    show,

    message,

    type="warning",

    onClose

}) {



if(!show){

    return null;

}



const icons={


warning:<FaExclamationTriangle/>,


danger:<FaBan/>,


success:<FaCheckCircle/>


};





return(


<div className="warning-overlay">


<div 

className={`warning-box ${type}`}

>



<div className="warning-icon">

{
icons[type]
}


</div>




<div className="warning-content">


<h3>

{
type==="danger"
?
"Violation Detected"
:
"Warning"
}

</h3>


<p>

{message}

</p>


</div>





<button

className="close-btn"

onClick={onClose}

>


<FaTimes/>


</button>



</div>


</div>


)



}


export default WarningPopup;