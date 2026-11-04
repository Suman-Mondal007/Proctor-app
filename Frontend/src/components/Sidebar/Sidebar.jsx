import { NavLink, useNavigate } from "react-router-dom";

import {
    FaHome,
    FaClipboardList,
    FaChartBar,
    FaUserGraduate,
    FaCog,
    FaSignOutAlt,
    FaUsers,
    FaFileAlt
} from "react-icons/fa";


import "./Sidebar.css";


function Sidebar({role="candidate"}){


const navigate = useNavigate();



const logout =()=>{

    localStorage.removeItem("token");

    navigate("/");

};



const candidateMenu=[

{
    name:"Dashboard",
    path:"/dashboard",
    icon:<FaHome/>
},


{
    name:"Exam",
    path:"/exam",
    icon:<FaClipboardList/>
},


{
    name:"Results",
    path:"/result",
    icon:<FaChartBar/>
},


{
    name:"Reports",
    path:"/reports",
    icon:<FaFileAlt/>
}


];





const adminMenu=[


{
    name:"Dashboard",
    path:"/admin",
    icon:<FaHome/>
},


{
    name:"Candidates",
    path:"/candidates",
    icon:<FaUsers/>
},


{
    name:"Exams",
    path:"/manage-exams",
    icon:<FaClipboardList/>
},


{
    name:"Reports",
    path:"/reports",
    icon:<FaChartBar/>
},


{
    name:"Settings",
    path:"/settings",
    icon:<FaCog/>
}


];



const menuItems = role==="admin"
?
adminMenu
:
candidateMenu;




return(

<aside className="sidebar">


<div className="sidebar-logo">

<h2>

AI<span>Exam</span>

</h2>

</div>




<div className="sidebar-profile">


<FaUserGraduate/>


<div>

<h4>
{
role==="admin"
?
"Administrator"
:
"Candidate"
}
</h4>

<p>
Online
</p>

</div>


</div>





<ul className="sidebar-menu">


{
menuItems.map((item,index)=>(


<li key={index}>


<NavLink

to={item.path}

className={({isActive})=>

isActive
?
"active"
:
""

}

>


{item.icon}


<span>
{item.name}
</span>


</NavLink>


</li>


))

}


</ul>





<div className="sidebar-bottom">


<button onClick={logout}>


<FaSignOutAlt/>

Logout


</button>


</div>



</aside>


)

}


export default Sidebar;