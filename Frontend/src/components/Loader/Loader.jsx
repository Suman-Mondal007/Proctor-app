import "./Loader.css";


function Loader({
    fullScreen = false,
    text = "Loading..."
}) {


return (

<div 
className={
    fullScreen 
    ? "loader-wrapper fullscreen"
    : "loader-wrapper"
}
>


<div className="loader-circle">

</div>


{
    text &&
    <p>
        {text}
    </p>
}


</div>

);


}


export default Loader;