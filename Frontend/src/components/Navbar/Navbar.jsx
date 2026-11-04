import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
    FaBars,
    FaTimes,
    FaUserCircle,
    FaSignOutAlt,
    FaHome,
    FaClipboardList,
    FaChartBar
} from "react-icons/fa";


import "./Navbar.css";


function Navbar(){

    const [menuOpen,setMenuOpen] = useState(false);

    const navigate = useNavigate();


    const logout = () => {

        localStorage.removeItem("token");

        navigate("/");

    };


    return(

        <nav className="navbar">


            {/* Logo */}

            <div className="navbar-logo">

                <h2>
                    AI<span>Exam</span>
                </h2>

            </div>



            {/* Mobile Menu Button */}

            <div 
            className="menu-icon"
            onClick={()=>setMenuOpen(!menuOpen)}
            >

                {
                    menuOpen 
                    ?
                    <FaTimes/>
                    :
                    <FaBars/>
                }

            </div>



            {/* Links */}

            <div 
            className={
                menuOpen 
                ?
                "nav-links active"
                :
                "nav-links"
            }
            >


                <Link to="/dashboard">

                    <FaHome/>

                    Dashboard

                </Link>



                <Link to="/exam">

                    <FaClipboardList/>

                    Exam

                </Link>



                <Link to="/reports">

                    <FaChartBar/>

                    Reports

                </Link>



            </div>



            {/* Profile */}


            <div className="profile">


                <FaUserCircle/>


                <span>
                    Candidate
                </span>


                <button onClick={logout}>

                    <FaSignOutAlt/>

                    Logout

                </button>


            </div>


        </nav>

    )

}


export default Navbar;