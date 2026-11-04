import { createContext, useContext, useState } from "react";


const ViolationContext = createContext();



export function ViolationProvider({ children }) {


    const [violations, setViolations] = useState([]);



    const addViolation = (type) => {


        const violation = {

            id: Date.now(),

            type: type,

            time: new Date().toLocaleTimeString()

        };


        setViolations((prev)=>[
            ...prev,
            violation
        ]);


    };



    const clearViolations = () => {

        setViolations([]);

    };




    return (

        <ViolationContext.Provider

            value={{

                violations,

                addViolation,

                clearViolations

            }}

        >

            {children}

        </ViolationContext.Provider>

    );

}




export function useViolation(){

    return useContext(ViolationContext);

}