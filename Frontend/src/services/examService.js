import API from "./api";

// Get all active exams
export const getAllExams = async () => {
    return await API.get("/exams");
};

// Get one exam
export const getExamById = async (id) => {
    return await API.get(`/exams/${id}`);
};

// Create exam
export const createExam = async (data) => {
    return await API.post("/exams", data);
};

// Delete exam
export const deleteExam = async (id) => {
    return await API.delete(`/exams/${id}`);
};