import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";


// Pages

import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import SignIn from "../pages/SignIn/SignIn";
import Register from "../pages/Register/Register";

import Dashboard from "../pages/Dashboard/Dashboard";
import AvailableExams from "../pages/AvailableExams/AvailableExams";
import Exam from "../pages/Exam/Exam";
import Result from "../pages/Result/Result";

import Profile from "../pages/Profile/Profile";
import ExamHistory from "../pages/ExamHistory/ExamHistory";
import ExamInstructions from "../pages/ExamInstructions/ExamInstructions";
import MockInterviewSetup from "../pages/MockInterviewSetup/MockInterviewSetup";
import MockInterviewRoom from "../pages/MockInterviewRoom/MockInterviewRoom";


// Admin Pages

import Admin from "../pages/Admin/Admin";
import AdminLogin from "../pages/AdminLogin/AdminLogin";
import AdminQuestions from "../pages/AdminQuestions/AdminQuestions";
import AdminResults from "../pages/AdminResults/AdminResults";
import AdminExam from "../pages/AdminExam/AdminExam";

import QuestionManagement from "../pages/QuestionManagement/QuestionManagement";

import Reports from "../pages/Reports/Reports";
import LiveMonitoring from "../pages/LiveMonitoring/LiveMonitoring";


// Route Guards

import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import Analytics from "../pages/Analytics/Analytics";




function AppRoutes(){


return(


<BrowserRouter>


<Routes>



{/* ==========================
    PUBLIC ROUTES
========================== */}


<Route

path="/"

element={<Home/>}

/>



<Route

path="/signin"

element={<SignIn/>}

/>



<Route

path="/login"

element={<Login/>}

/>



<Route

path="/register"

element={<Register/>}

/>



<Route

path="/admin-login"

element={<AdminLogin/>}

/>



<Route

path="/live-monitoring"

element={<LiveMonitoring/>}

/>





{/* ==========================
    CANDIDATE ROUTES
========================== */}



<Route

path="/dashboard"

element={

<ProtectedRoute>

<Dashboard/>

</ProtectedRoute>

}

/>

<Route
  path="/mock-interview-setup"
  element={
    <ProtectedRoute>
      <MockInterviewSetup />
    </ProtectedRoute>
  }
/>

<Route
  path="/mock-interview-room"
  element={
    <ProtectedRoute>
      <MockInterviewRoom />
    </ProtectedRoute>
  }
/>





<Route

path="/available-exams"

element={

<ProtectedRoute>

<AvailableExams/>

</ProtectedRoute>

}

/>






<Route

path="/exam/:examId"

element={

<ProtectedRoute>

<Exam/>

</ProtectedRoute>

}

/>


<Route
    path="/analytics"
    element={
        <AdminRoute>
            <Analytics />
        </AdminRoute>
    }
/>



<Route

path="/result"

element={

<ProtectedRoute>

<Result/>

</ProtectedRoute>

}

/>






<Route

path="/exam-instructions"

element={

<ProtectedRoute>

<ExamInstructions/>

</ProtectedRoute>

}

/>





<Route

path="/history"

element={

<ProtectedRoute>

<ExamHistory/>

</ProtectedRoute>

}

/>





<Route

path="/profile"

element={

<ProtectedRoute>

<Profile/>

</ProtectedRoute>

}

/>






{/* ==========================
    ADMIN ROUTES
========================== */}



<Route

path="/admin"

element={

<AdminRoute>

<Admin/>

</AdminRoute>

}

/>





<Route

path="/admin/questions"

element={

<AdminRoute>

<AdminQuestions/>

</AdminRoute>

}

/>





<Route

path="/admin/exams"

element={

<AdminRoute>

<AdminExam/>

</AdminRoute>

}

/>





<Route

path="/admin/results"

element={

<AdminRoute>

<AdminResults/>

</AdminRoute>

}

/>





<Route

path="/questions"

element={

<AdminRoute>

<QuestionManagement/>

</AdminRoute>

}

/>





<Route

path="/reports"

element={

<AdminRoute>

<Reports/>

</AdminRoute>

}

/>






</Routes>


</BrowserRouter>


);


}


export default AppRoutes;