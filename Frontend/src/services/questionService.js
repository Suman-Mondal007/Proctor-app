import API from "./api";


// ==============================
// Get All Questions
// ==============================

export const getQuestions = async () => {

    return await API.get(
        "/questions"
    );

};



// ==============================
// Get Single Question
// ==============================

export const getQuestionById = async (id) => {

    return await API.get(
        `/questions/${id}`
    );

};



// ==============================
// Add Question (Admin)
// ==============================

export const createQuestion = async (questionData) => {

    return await API.post(

        "/questions",

        questionData

    );

};



// ==============================
// Update Question (Admin)
// ==============================

export const updateQuestion = async (
    id,
    questionData
) => {

    return await API.put(

        `/questions/${id}`,

        questionData

    );

};



// ==============================
// Delete Question (Admin)
// ==============================

export const deleteQuestion = async (id) => {

    return await API.delete(

        `/questions/${id}`

    );

};