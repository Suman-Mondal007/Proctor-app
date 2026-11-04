import {
  createContext,
  useContext,
  useState,
  useEffect
} from "react";

import API from "../services/api";


const AuthContext = createContext();



export function AuthProvider({ children }) {


  const [user, setUser] = useState(() => {

    try {

      const savedUser = localStorage.getItem("user");


      if (savedUser) {


        const parsedUser = JSON.parse(savedUser);


        console.log(
          "RESTORED USER:",
          parsedUser
        );


        // Fix old saved id problem
        if(parsedUser.id && !parsedUser._id){

          parsedUser._id = parsedUser.id;

          localStorage.setItem(
            "user",
            JSON.stringify(parsedUser)
          );

        }


        return parsedUser;

      }


      return null;


    }
    catch(error){

      console.log(
        "USER RESTORE ERROR",
        error
      );

      return null;

    }


  });



  const [token,setToken]=useState(()=>{

    return localStorage.getItem("token") || null;

  });





  // ==========================================
  // FETCH LATEST USER FROM DATABASE
  // ==========================================

  const fetchLatestUser = async()=>{


    try{


      const storedUser =
      JSON.parse(
        localStorage.getItem("user")
      );



      const userId =
      storedUser?._id ||
      storedUser?.id;



      if(!userId)
      return;




      const response =
      await API.get(
        `/users/profile/${userId}`
      );



      const latestUser =
      response.data.user ||
      response.data;



      if(latestUser){



        setUser(latestUser);



        localStorage.setItem(
          "user",
          JSON.stringify(latestUser)
        );


      }



    }
    catch(error){


      console.log(
        "FETCH USER PROFILE ERROR:",
        error.message
      );


    }


  };





  // Run when application starts
  useEffect(()=>{


    if(token){

      fetchLatestUser();

    }


  },[token]);








  // ==========================================
  // LOGIN
  // ==========================================


  const login=(userData,accessToken)=>{


    console.log(
      "LOGIN DATA:",
      userData
    );



    // Fix id -> _id
    if(userData.id && !userData._id){

      userData._id=userData.id;

    }



    setUser(userData);

    setToken(accessToken);



    localStorage.setItem(
      "user",
      JSON.stringify(userData)
    );


    localStorage.setItem(
      "token",
      accessToken
    );



  };









  // ==========================================
  // LOGOUT
  // ==========================================


  const logout=()=>{


    setUser(null);

    setToken(null);



    localStorage.removeItem(
      "user"
    );


    localStorage.removeItem(
      "token"
    );


  };









  // ==========================================
  // UPDATE PROFILE
  // ==========================================


  const updateUserProfile=(updatedUserData)=>{


    setUser((prevUser)=>{


      const newUserData={

        ...prevUser,

        ...updatedUserData

      };




      // Maintain _id
      if(
        newUserData.id &&
        !newUserData._id
      ){

        newUserData._id=
        newUserData.id;

      }




      localStorage.setItem(

        "user",

        JSON.stringify(newUserData)

      );



      return newUserData;


    });



  };









  // ==========================================
  // CHANGE PASSWORD
  // ==========================================


  const changeUserPassword=
  async({
    userId,
    currentPassword,
    newPassword
  })=>{


    const targetId =
    userId ||
    user?._id ||
    user?.id;



    const response =
    await API.put(
      "/users/change-password",
      {

        userId:targetId,

        currentPassword,

        newPassword

      }
    );



    return response.data;


  };







  return (

    <AuthContext.Provider

      value={{

        user,

        token,

        setUser,

        login,

        logout,

        updateUserProfile,

        changeUserPassword,

        fetchLatestUser,

        isAuthenticated:Boolean(token)

      }}

    >

      {children}


    </AuthContext.Provider>

  );


}







export function useAuth(){

  return useContext(AuthContext);

}