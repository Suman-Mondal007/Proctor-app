import API from "./api";

// Get one candidate's results
export const getCandidateResult = (id) => {
    return API.get(`/results/${id}`);
};

// Alias (for Dashboard)
export const getCandidateResults = (id) => {
    return API.get(`/results/${id}`);
};

// Submit result
export const submitResult = (data) => {
    return API.post("/results", data);
};

// Admin: Get all results
export const getAllResults = () => {
    return API.get("/results");
};