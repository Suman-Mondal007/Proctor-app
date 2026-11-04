import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaClock,
  FaClipboardList,
  FaCheckCircle,
  FaTimesCircle,
  FaMinusCircle,
  FaExclamationTriangle,
  FaCamera,
  FaMicrophone,
  FaDesktop,
  FaArrowRight,
  FaUserShield,
  FaSignOutAlt,
  FaUserEdit,
  FaHistory,
  FaChevronDown,
  FaCalendarAlt,
  FaKey,
  FaTimes,
  FaSave,
  FaUpload,
  FaTrashAlt,
  FaHome,
  FaBars,
  FaTrophy,
  FaSearch,
  FaEye,
  FaEyeSlash,
  FaLightbulb,
  FaRobot,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { getCandidateResults } from "../../services/resultService";
import API from "../../services/api";
import MockInterviewCard from "../../components/MockInterviewCard/MockInterviewCard";
import "./Dashboard.css";

const MAX_PHOTO_SIZE_MB = 2;

const isPassedStatus = (status) => {
  const s = (status || "").toUpperCase();
  return s === "PASS" || s === "PASSED";
};

const getResultDate = (item) =>
  new Date(item.completedAt || item.submittedAt || item.createdAt || item.date || 0).getTime() || 0;

const getGreeting = (date) => {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

/* ---------------------------------------------------------------------------
   Result-detail helpers: turn whatever shape the API returns into a clean list
   of { question, options, given, correct, isCorrect, answered, explanation }
   ------------------------------------------------------------------------ */
const toText = (v) => {
  if (v === undefined || v === null) return "";
  if (typeof v === "object") return String(v.text ?? v.label ?? v.value ?? v.option ?? JSON.stringify(v));
  return String(v);
};

const firstDefined = (...values) => values.find((v) => v !== undefined && v !== null && v !== "");

// A stored answer may be the option text, its index, or a letter (A/B/C/D)
const resolveChoice = (value, options) => {
  if (value === undefined || value === null || value === "") return { text: "", index: -1 };
  const opts = Array.isArray(options) ? options : [];

  if (opts.length) {
    if (typeof value === "number" && opts[value] !== undefined) {
      return { text: toText(opts[value]), index: value };
    }
    const str = toText(value).trim();
    const byText = opts.findIndex((o) => toText(o).trim().toLowerCase() === str.toLowerCase());
    if (byText >= 0) return { text: toText(opts[byText]), index: byText };
    if (/^[a-d]$/i.test(str)) {
      const li = str.toUpperCase().charCodeAt(0) - 65;
      if (opts[li] !== undefined) return { text: toText(opts[li]), index: li };
    }
    if (/^\d+$/.test(str) && opts[Number(str)] !== undefined) {
      return { text: toText(opts[Number(str)]), index: Number(str) };
    }
  }
  return { text: toText(value), index: -1 };
};

const RESULT_LIST_KEYS = ["answers", "responses", "questionResults", "details", "questions"];

// 24-char Mongo id, uuid, or purely numeric id
const isIdLike = (v) => typeof v === "string" && /^([a-f0-9]{24}|[0-9a-f]{8}-[0-9a-f-]{27}|\d+)$/i.test(v.trim());

const getQuestionObjectText = (q) =>
  q && typeof q === "object"
    ? q.questionText || q.question || q.text || q.title || q.name || q.statement || ""
    : "";

const entryHasText = (entry) => {
  if (!entry || typeof entry !== "object") return true;
  if (entry.questionText || entry.text) return true;
  if (typeof entry.question === "string" && entry.question.trim() && !isIdLike(entry.question)) return true;
  if (getQuestionObjectText(entry.question)) return true;
  if (getQuestionObjectText(entry.questionId)) return true;
  return false;
};

const getEntryQuestionId = (entry) => {
  if (!entry || typeof entry !== "object") return null;
  const candidates = [entry.questionId, entry.question, entry.qid, entry.question_id];
  for (const c of candidates) {
    if (c && typeof c === "object" && (c._id || c.id)) return String(c._id || c.id);
    if (isIdLike(c)) return String(c).trim();
  }
  return null;
};

/* If saved answers only store question IDs, look the real questions up
   (exam question set -> global question bank -> single question) and
   attach them so the review can show the actual question text. */
const enrichQuestionTexts = async (result) => {
  if (!result) return result;
  const key = RESULT_LIST_KEYS.find((k) => Array.isArray(result[k]) && result[k].length > 0);
  if (!key) return result;

  const entries = result[key];
  if (entries.every(entryHasText)) return result;

  const map = {};
  const addAll = (arr) => {
    if (!Array.isArray(arr)) return;
    arr.forEach((q) => {
      if (q && typeof q === "object" && (q._id || q.id)) map[String(q._id || q.id)] = q;
    });
  };
  let setQuestions = [];

  // 1. the exam / question set the result belongs to
  const examRef = result.questionSetId || result.setId || result.examId || result.exam;
  const examId = examRef && typeof examRef === "object" ? examRef._id || examRef.id : examRef;
  if (examId) {
    try {
      const r = await API.get(`/question-sets/${examId}`);
      const qs = r.data?.questions || r.data?.data?.questions;
      if (Array.isArray(qs)) {
        setQuestions = qs.filter((q) => q && typeof q === "object");
        addAll(setQuestions);
      }
    } catch (e) {
      /* ignore — try the next source */
    }
  }

  const ids = entries.map(getEntryQuestionId);
  const missing = () => ids.filter((id) => id && !map[id]);

  // 2. the global question bank
  if (missing().length) {
    try {
      const r = await API.get("/questions");
      addAll(r.data?.data || r.data?.questions || r.data);
    } catch (e) {
      /* ignore */
    }
  }

  // 3. any still-missing questions, one by one
  const stillMissing = [...new Set(missing())].slice(0, 60);
  await Promise.all(
    stillMissing.map(async (id) => {
      try {
        const r = await API.get(`/questions/${id}`);
        const q = r.data?.question || r.data?.data || r.data;
        if (q && typeof q === "object") map[id] = q;
      } catch (e) {
        /* ignore */
      }
    })
  );

  const enriched = entries.map((entry, i) => {
    if (entryHasText(entry)) return entry;
    const id = getEntryQuestionId(entry);
    let q = id ? map[id] : null;
    // no id stored at all: fall back to the set order when the counts match
    if (!q && !id && setQuestions.length === entries.length) q = setQuestions[i];
    return q ? { ...entry, question: q } : entry;
  });

  return { ...result, [key]: enriched };
};

const normalizeQuestions = (result) => {
  if (!result) return [];
  const list =
    result.answers || result.responses || result.questionResults || result.details || result.questions || [];
  if (!Array.isArray(list)) return [];

  return list
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => {
      const q =
        entry.question && typeof entry.question === "object"
          ? entry.question
          : entry.questionId && typeof entry.questionId === "object"
          ? entry.questionId
          : null;

      const question =
        entry.questionText ||
        getQuestionObjectText(q) ||
        (typeof entry.question === "string" && !isIdLike(entry.question) ? entry.question : "") ||
        entry.text ||
        "";

      const options = entry.options || entry.choices || (q && (q.options || q.choices)) || [];

      const givenRaw = firstDefined(
        entry.selectedOption,
        entry.selectedAnswer,
        entry.givenAnswer,
        entry.userAnswer,
        entry.selected,
        entry.response,
        entry.answer
      );
      const correctRaw = firstDefined(
        entry.correctOption,
        entry.correctAnswer,
        entry.correct,
        entry.rightAnswer,
        q ? q.correctAnswer : undefined,
        q ? q.correctOption : undefined,
        q ? q.correctIndex : undefined,
        q ? q.answer : undefined
      );

      const given = resolveChoice(givenRaw, options);
      const correct = resolveChoice(correctRaw, options);
      const answered = given.text.trim() !== "";

      const isCorrect =
        typeof entry.isCorrect === "boolean"
          ? entry.isCorrect
          : answered &&
            correct.text.trim() !== "" &&
            given.text.trim().toLowerCase() === correct.text.trim().toLowerCase();

      return {
        question,
        options: Array.isArray(options) ? options : [],
        given,
        correct,
        answered,
        isCorrect,
        explanation: entry.explanation || (q && q.explanation) || "",
      };
    });
};

function Dashboard() {
  const { user, logout, updateUserProfile, changeUserPassword } = useAuth();
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // View Details modal state
  const [selectedResult, setSelectedResult] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reviewFilter, setReviewFilter] = useState("all");

  const [systemChecks, setSystemChecks] = useState({
    camera: false,
    mic: false,
    checking: false,
    tested: false,
  });
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [navScrolled, setNavScrolled] = useState(false);
  const menuRef = useRef(null);

  // Modal States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState({ type: "", text: "" });
  const [showPasswords, setShowPasswords] = useState(false);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    altPhone: "",
    dob: "",
    gender: "Male",
    address: "",
    district: "",
    state: "",
    country: "India",
    pincode: "",
    photo: null,
    photoPreview: "",
  });

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const getUserAvatar = (userData) => {
    if (!userData) return "";
    return userData.photoUrl || userData.photo || userData.avatar || "";
  };

  // 1. On Mount: Fetch fresh profile from backend & sync AuthContext
  useEffect(() => {
    const fetchFreshProfile = async () => {
      const userId = user?._id || user?.id;
      if (!userId) return;

      try {
        const res = await API.get(`/users/profile/${userId}`);
        const freshUser = res.data?.user || res.data;
        if (freshUser && updateUserProfile) {
          updateUserProfile(freshUser);
        }
      } catch (err) {
        console.warn("Could not retrieve stored profile from server:", err);
      }
    };

    fetchFreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Keep local profileData synchronized whenever `user` changes
  useEffect(() => {
    if (user) {
      const avatarSrc = getUserAvatar(user);
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        altPhone: user.altPhone || "",
        dob: user.dob ? user.dob.split("T")[0] : "",
        gender: user.gender || "Male",
        address: user.address || "",
        district: user.district || "",
        state: user.state || "",
        country: user.country || "India",
        pincode: user.pincode || "",
        photo: null,
        photoPreview: avatarSrc,
      });
    }
  }, [user]);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Navbar shadow on scroll
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeDetails = () => {
    setSelectedResult(null);
    setDetailData(null);
    setDetailLoading(false);
  };

  // Escape closes modals / menus
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setIsProfileModalOpen(false);
        setIsPasswordModalOpen(false);
        setSelectedResult(null);
        setDetailData(null);
        setMenuOpen(false);
        setMobileNavOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Lock body scroll while a modal is open
  useEffect(() => {
    const locked = isProfileModalOpen || isPasswordModalOpen || selectedResult !== null;
    document.body.style.overflow = locked ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isProfileModalOpen, isPasswordModalOpen, selectedResult]);

  // Release object URLs
  useEffect(() => {
    const preview = profileData.photoPreview;
    return () => {
      if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [profileData.photoPreview]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const candidateId = user?._id || user?.id;

      if (!candidateId) {
        setLoading(false);
        return;
      }

      const response = await getCandidateResults(candidateId);
      setResults(response.data || []);
    } catch (error) {
      console.error("Error fetching candidate results:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, user?.id]);

  // Open the details modal. Loads the full record when needed and looks up the
  // real question text when only question IDs were saved.
  const openDetails = async (item) => {
    setReviewFilter("all");
    setDetailData(null);
    setSelectedResult(item);

    const initial = normalizeQuestions(item);
    const hasList = initial.length > 0;
    const textsMissing = hasList && initial.some((q) => !q.question);
    if (hasList && !textsMissing) return;

    const id = item._id || item.id || item.resultId;

    setDetailLoading(true);
    try {
      let full = item;

      if (!hasList && id) {
        try {
          const res = await API.get(`/results/${id}`);
          const data = res.data?.result || res.data?.data || res.data;
          if (data && typeof data === "object") full = { ...item, ...data };
        } catch (err) {
          console.warn("Could not load detailed result:", err);
        }
      }

      const enriched = await enrichQuestionTexts(full);
      setDetailData(enriched);
    } catch (err) {
      console.warn("Could not load question details:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle Delete History Result
  const handleDeleteResult = async (e, resultId, title) => {
    e.stopPropagation();
    if (!resultId) {
      alert("Invalid record identifier.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete the record for "${title || "this exam"}"?`
    );
    if (!confirmDelete) return;

    setDeletingId(resultId);
    try {
      await API.delete(`/results/${resultId}`);
      setResults((prev) =>
        prev.filter((item) => (item._id || item.id || item.resultId) !== resultId)
      );
    } catch (error) {
      console.error("Failed to delete exam record:", error);
      alert(error.response?.data?.message || "Failed to delete record. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // System Diagnostics Check
  const runSystemDiagnostics = async () => {
    setSystemChecks((prev) => ({ ...prev, checking: true }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      const hasVideo = stream.getVideoTracks().length > 0;
      const hasAudio = stream.getAudioTracks().length > 0;

      stream.getTracks().forEach((track) => track.stop());

      setSystemChecks({
        camera: hasVideo,
        mic: hasAudio,
        checking: false,
        tested: true,
      });
    } catch (error) {
      console.error("Hardware test failed:", error);
      setSystemChecks({
        camera: false,
        mic: false,
        checking: false,
        tested: true,
      });
    }
  };

  const handleLogout = () => {
    if (logout) logout();
    navigate("/login");
  };

  const scrollToSection = (id, navKey) => {
    setActiveNav(navKey);
    setMenuOpen(false);
    setMobileNavOpen(false);
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const openProfileModal = () => {
    setMenuOpen(false);
    setMobileNavOpen(false);
    setModalMessage({ type: "", text: "" });
    setIsProfileModalOpen(true);
  };

  const openPasswordModal = () => {
    setMenuOpen(false);
    setMobileNavOpen(false);
    setModalMessage({ type: "", text: "" });
    setShowPasswords(false);
    setIsPasswordModalOpen(true);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
      setModalMessage({
        type: "error",
        text: `Photo must be smaller than ${MAX_PHOTO_SIZE_MB} MB.`,
      });
      return;
    }

    setModalMessage({ type: "", text: "" });
    setProfileData((prev) => ({
      ...prev,
      photo: file,
      photoPreview: URL.createObjectURL(file),
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalMessage({ type: "", text: "" });

    try {
      const userId = user?._id || user?.id;
      let response;

      if (profileData.photo) {
        const formData = new FormData();
        formData.append("userId", userId);
        formData.append("name", profileData.name || "");
        formData.append("email", profileData.email || "");
        formData.append("phone", profileData.phone || "");
        formData.append("altPhone", profileData.altPhone || "");
        formData.append("dob", profileData.dob || "");
        formData.append("gender", profileData.gender || "Male");
        formData.append("address", profileData.address || "");
        formData.append("district", profileData.district || "");
        formData.append("state", profileData.state || "");
        formData.append("country", profileData.country || "India");
        formData.append("pincode", profileData.pincode || "");
        formData.append("photo", profileData.photo);

        response = await API.put("/users/profile", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        const payload = {
          userId,
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          altPhone: profileData.altPhone,
          dob: profileData.dob,
          gender: profileData.gender,
          address: profileData.address,
          district: profileData.district,
          state: profileData.state,
          country: profileData.country,
          pincode: profileData.pincode,
        };

        response = await API.put("/users/profile", payload);
      }

      const updatedUser = response.data?.user || response.data;

      if (updateUserProfile) {
        updateUserProfile(updatedUser);
      } else {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...storedUser, ...updatedUser }));
      }

      setModalMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => {
        setIsProfileModalOpen(false);
        setModalMessage({ type: "", text: "" });
      }, 1500);
    } catch (error) {
      console.error("Profile update error:", error);
      setModalMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to save profile. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setModalMessage({ type: "", text: "" });

    if (passwordData.newPassword.length < 8) {
      setModalMessage({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setModalMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    setIsSubmitting(true);
    try {
      const userId = user?._id || user?.id;

      if (changeUserPassword) {
        await changeUserPassword({
          userId,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        });
      } else {
        await API.put("/users/change-password", {
          userId,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        });
      }

      setModalMessage({ type: "success", text: "Password changed successfully!" });
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setModalMessage({ type: "", text: "" });
      }, 1500);
    } catch (error) {
      console.error("Password update error:", error);
      setModalMessage({
        type: "error",
        text: error.response?.data?.message || "Error updating password.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Derive score and percentage from a result item
  const getExamMetrics = (item) => {
    const rawScore = item.score !== undefined ? Number(item.score) : 0;

    let totalQ = Number(
      item.totalQuestions ||
        item.total ||
        item.totalMarks ||
        (Array.isArray(item.answers) ? item.answers.length : 0)
    );
    if (totalQ <= 0) totalQ = 5; // fallback default if not specified

    const score = Math.min(rawScore, totalQ);

    let percentage =
      item.percentage !== undefined ? Number(item.percentage) : Math.round((score / totalQ) * 100);
    if (isNaN(percentage)) percentage = 0;

    return { score, totalQ, percentage };
  };

  const resultsNewestFirst = useMemo(
    () => [...results].sort((a, b) => getResultDate(b) - getResultDate(a)),
    [results]
  );

  const totalExams = results.length;
  const passedExams = results.filter((r) => isPassedStatus(r.status)).length;
  const failedExams = totalExams - passedExams;
  const latest = resultsNewestFirst[0];

  const latestMetrics = latest ? getExamMetrics(latest) : { score: 0, totalQ: 5, percentage: 0 };
  const latestScore = latestMetrics.percentage;

  const averageScore =
    totalExams > 0
      ? Math.round(results.reduce((acc, curr) => acc + getExamMetrics(curr).percentage, 0) / totalExams)
      : 0;

  const bestScore = totalExams > 0 ? Math.max(...results.map((r) => getExamMetrics(r).percentage)) : 0;
  const passRate = totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0;

  const profileCompletion = useMemo(() => {
    if (!user) return 0;
    const fields = [
      user.name,
      user.email,
      user.phone,
      user.dob,
      user.gender,
      user.address,
      user.district,
      user.state,
      user.pincode,
      getUserAvatar(user),
    ];
    const filled = fields.filter((f) => f && String(f).trim() !== "").length;
    return Math.round((filled / fields.length) * 100);
  }, [user]);

  const filteredResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const list = resultsNewestFirst.filter((item) => {
      const passed = isPassedStatus(item.status);
      if (activeTab === "pass" && !passed) return false;
      if (activeTab === "fail" && passed) return false;
      if (term) {
        const title = (item.examTitle || item.title || "Technical Assessment").toLowerCase();
        if (!title.includes(term)) return false;
      }
      return true;
    });

    const pct = (r) => getExamMetrics(r).percentage;
    if (sortBy === "oldest") list.sort((a, b) => getResultDate(a) - getResultDate(b));
    if (sortBy === "highest") list.sort((a, b) => pct(b) - pct(a));
    if (sortBy === "lowest") list.sort((a, b) => pct(a) - pct(b));
    return list;
  }, [resultsNewestFirst, activeTab, searchTerm, sortBy]);

  // ---- Details modal derived data ----
  const activeDetail = detailData || selectedResult;
  const reviewQuestions = useMemo(() => normalizeQuestions(activeDetail), [activeDetail]);
  const reviewCounts = useMemo(() => {
    const correct = reviewQuestions.filter((q) => q.answered && q.isCorrect).length;
    const incorrect = reviewQuestions.filter((q) => q.answered && !q.isCorrect).length;
    const skipped = reviewQuestions.filter((q) => !q.answered).length;
    return { correct, incorrect, skipped, total: reviewQuestions.length };
  }, [reviewQuestions]);

  const visibleReview = reviewQuestions
    .map((q, idx) => ({ ...q, number: idx + 1 }))
    .filter((q) => {
      if (reviewFilter === "correct") return q.answered && q.isCorrect;
      if (reviewFilter === "incorrect") return q.answered && !q.isCorrect;
      if (reviewFilter === "skipped") return !q.answered;
      return true;
    });

  const detailMetrics = activeDetail ? getExamMetrics(activeDetail) : null;
  const detailCompletedAt = activeDetail
    ? activeDetail.completedAt || activeDetail.submittedAt || activeDetail.createdAt || activeDetail.date
    : null;
  const detailDuration = activeDetail
    ? activeDetail.timeTaken || activeDetail.duration || activeDetail.timeSpent
    : null;
  const detailViolations = activeDetail
    ? Array.isArray(activeDetail.violations)
      ? activeDetail.violations.length
      : activeDetail.violations ?? activeDetail.violationCount ?? null
    : null;

  const displayAvatar = profileData.photoPreview || getUserAvatar(user);

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: <FaHome />, target: "top" },
    { key: "interview", label: "Mock Interview", icon: <FaRobot />, target: "mock-interview-section" },
    { key: "history", label: "Exam History", icon: <FaHistory />, target: "history-section" },
  ];

  const hwStatusClass = !systemChecks.tested
    ? "pending"
    : systemChecks.camera && systemChecks.mic
    ? "ok"
    : "error";
  const hwStatusText = !systemChecks.tested
    ? "System not tested"
    : systemChecks.camera && systemChecks.mic
    ? "System ready"
    : "Check permissions";

  return (
    <div className="dashboard-page">
      <div className="ambient-glow"></div>

      {/* ===================== Top Navigation Bar ===================== */}
      <nav className={`top-nav-bar ${navScrolled ? "scrolled" : ""}`}>
        <div className="top-nav-inner">
          <div className="nav-left">
            <button
              className="hamburger-btn"
              onClick={() => setMobileNavOpen((p) => !p)}
              aria-label="Toggle navigation"
              aria-expanded={mobileNavOpen}
            >
              {mobileNavOpen ? <FaTimes /> : <FaBars />}
            </button>

            <div className="brand-identifier" onClick={() => scrollToSection("top", "dashboard")}>
              <span className="brand-logo-wrap">
                <FaUserShield className="brand-logo-icon" />
              </span>
              <span className="brand-text">
                Proctor<strong>Portal</strong>
              </span>
            </div>

            <ul className="nav-links">
              {navItems.map((item) => (
                <li key={item.key}>
                  <button
                    className={`nav-link ${activeNav === item.key ? "active" : ""}`}
                    onClick={() => scrollToSection(item.target, item.key)}
                  >
                    {item.icon} {item.label}
                  </button>
                </li>
              ))}
              <li>
                <Link to="/available-exams" className="nav-link">
                  <FaClipboardList /> Available Exams
                </Link>
              </li>
            </ul>
          </div>

          <div className="top-nav-right" ref={menuRef}>
            <div className={`nav-status-pill ${hwStatusClass}`} title="Camera & microphone status">
              <span className="status-dot"></span>
              <span className="status-text">{hwStatusText}</span>
            </div>

            <button
              className="btn-secondary test-hardware-top-btn"
              onClick={runSystemDiagnostics}
              disabled={systemChecks.checking}
            >
              {systemChecks.checking ? <span className="spinner"></span> : <FaCamera />}
              <span className="btn-label">
                {systemChecks.tested ? "Re-test Hardware" : "Test Camera & Mic"}
              </span>
            </button>

            {/* Profile Menu Dropdown */}
            <div className="menu-dropdown-wrapper">
              <button
                className="menu-toggle-btn"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <div className="user-avatar-mini">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="User Profile" className="avatar-img-mini" />
                  ) : user?.name ? (
                    user.name.charAt(0).toUpperCase()
                  ) : (
                    "C"
                  )}
                </div>
                <span className="user-name-label">{user?.name || "Candidate"}</span>
                <FaChevronDown className={`chevron-icon ${menuOpen ? "open" : ""}`} />
              </button>

              {menuOpen && (
                <div className="dropdown-menu-content">
                  <div className="dropdown-header">
                    <div className="drop-user-row">
                      <div className="user-avatar-mini large">
                        {displayAvatar ? (
                          <img src={displayAvatar} alt="" className="avatar-img-mini" />
                        ) : user?.name ? (
                          user.name.charAt(0).toUpperCase()
                        ) : (
                          "C"
                        )}
                      </div>
                      <div className="drop-user-text">
                        <p className="drop-name">{user?.name || "Candidate"}</p>
                        <p className="drop-email">{user?.email || "candidate@portal.com"}</p>
                      </div>
                    </div>
                    <span className="role-badge">Candidate</span>

                    <div className="profile-completion">
                      <div className="pc-row">
                        <span>Profile completion</span>
                        <strong>{profileCompletion}%</strong>
                      </div>
                      <div className="pc-bar">
                        <div className="pc-fill" style={{ width: `${profileCompletion}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>

                  <button className="dropdown-item" onClick={openProfileModal}>
                    <FaUserEdit /> Update Profile
                  </button>

                  <button className="dropdown-item" onClick={openPasswordModal}>
                    <FaKey /> Change Password
                  </button>

                  <Link to="/available-exams" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                    <FaClipboardList /> Available Exams
                  </Link>

                  <button
                    className="dropdown-item"
                    onClick={() => scrollToSection("history-section", "history")}
                  >
                    <FaHistory /> Exam History
                  </button>

                  <div className="dropdown-divider"></div>

                  <button className="dropdown-item logout-action" onClick={handleLogout}>
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile navigation panel */}
        {mobileNavOpen && (
          <div className="mobile-nav-panel">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`mobile-nav-item ${activeNav === item.key ? "active" : ""}`}
                onClick={() => scrollToSection(item.target, item.key)}
              >
                {item.icon} {item.label}
              </button>
            ))}
            <Link to="/available-exams" className="mobile-nav-item" onClick={() => setMobileNavOpen(false)}>
              <FaClipboardList /> Available Exams
            </Link>
            <button className="mobile-nav-item" onClick={openProfileModal}>
              <FaUserEdit /> Update Profile
            </button>
            <button className="mobile-nav-item" onClick={openPasswordModal}>
              <FaKey /> Change Password
            </button>
            <button className="mobile-nav-item logout-action" onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>
          </div>
        )}
      </nav>

      <div className="dashboard-container">
        {/* Welcome Header */}
        <header className="dash-header">
          <div className="header-text">
            <span className="welcome-badge">
              <FaUserShield /> Candidate Portal
            </span>
            <h1>
              {getGreeting(currentTime)}, <span className="text-gradient">{user?.name || "Candidate"}</span>
            </h1>
            <div className="live-datetime-badge">
              <FaCalendarAlt className="datetime-icon" />
              <span>
                {currentTime.toLocaleDateString(undefined, {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="datetime-separator">•</span>
              <FaClock className="datetime-icon" />
              <span>{currentTime.toLocaleTimeString()}</span>
            </div>
            <p className="subtitle">
              Manage your technical assessments, system compatibility, and performance history.
            </p>
          </div>

          <div className="header-actions">
            <Link to="/available-exams" className="btn-primary">
              Browse Available Exams <FaArrowRight />
            </Link>
            <button className="btn-secondary logout-header-btn" onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </header>

        {/* Profile completion nudge */}
        {profileCompletion < 100 && user && (
          <div className="profile-nudge">
            <div className="nudge-text">
              <strong>Complete your profile</strong>
              <span>A complete profile helps verify your identity during proctored exams.</span>
            </div>
            <div className="nudge-side">
              <div className="pc-bar nudge-bar">
                <div className="pc-fill" style={{ width: `${profileCompletion}%` }}></div>
              </div>
              <span className="nudge-percent">{profileCompletion}%</span>
              <button className="btn-secondary nudge-btn" onClick={openProfileModal}>
                Update
              </button>
            </div>
          </div>
        )}

        {/* Hardware Status Banner */}
        {systemChecks.tested && (
          <div className="hardware-banner">
            <div className="hw-item">
              <FaCamera className={systemChecks.camera ? "icon-pass" : "icon-fail"} />
              <span>Camera: {systemChecks.camera ? "Ready" : "Permission Denied"}</span>
            </div>
            <div className="hw-item">
              <FaMicrophone className={systemChecks.mic ? "icon-pass" : "icon-fail"} />
              <span>Microphone: {systemChecks.mic ? "Ready" : "Permission Denied"}</span>
            </div>
            <div className="hw-item">
              <FaDesktop className="icon-pass" />
              <span>Screen Capture: Compatible</span>
            </div>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="dashboard-cards">
          <div className="dash-card">
            <div className="card-icon blue">
              <FaClipboardList />
            </div>
            <div className="card-info">
              <h3>Exams Completed</h3>
              <p className="card-value">{totalExams}</p>
              <span className="card-sub">{passedExams} Assessment(s) Passed</span>
            </div>
          </div>

          <div className="dash-card">
            <div className="card-icon purple">
              <FaClock />
            </div>
            <div className="card-info">
              <h3>Latest Score</h3>
              <p className="card-value">{latestScore}%</p>
              <span className="card-sub">{latest ? `Status: ${latest.status}` : "No attempts recorded"}</span>
            </div>
          </div>

          <div className="dash-card">
            <div className="card-icon green">
              <FaCheckCircle />
            </div>
            <div className="card-info">
              <h3>Average Percentage</h3>
              <p className="card-value">{averageScore}%</p>
              <span className="card-sub">Across all registered subjects</span>
            </div>
          </div>

          <div className="dash-card">
            <div className="card-icon amber">
              <FaTrophy />
            </div>
            <div className="card-info">
              <h3>Best Score</h3>
              <p className="card-value">{bestScore}%</p>
              <span className="card-sub">Pass rate: {passRate}%</span>
            </div>
          </div>
        </div>

        {/* Featured Assessment Card */}
        <section className="exam-start-card">
          <div className="exam-card-content">
            <span className="live-tag">
              <span className="pulse-dot"></span> Ready to Launch
            </span>
            <h2>Technical Core Assessment 2026</h2>
            <p className="exam-topics">Topics covered: Java • Data Structures & Algorithms • React.js • SQL Databases</p>

            <div className="exam-meta">
              <div className="meta-chip">
                <span>Duration:</span> <strong>60 Mins</strong>
              </div>
              <div className="meta-chip">
                <span>Proctoring:</span> <strong>AI Vision + Audio</strong>
              </div>
              <div className="meta-chip">
                <span>Pass Score:</span> <strong>60%</strong>
              </div>
            </div>
          </div>

          <div className="exam-card-cta">
            <Link to="/available-exams" className="launch-btn">
              Start Assessment <FaArrowRight />
            </Link>
          </div>
        </section>

        {/* AI Mock Interview Section Component */}
        <div id="mock-interview-section" className="scroll-anchor">
          <MockInterviewCard />
        </div>

        {/* Guidelines Section */}
        <section className="rules-section">
          <h3>
            <FaExclamationTriangle className="warning-icon" /> AI Proctoring Compliance Guidelines
          </h3>
          <ul className="rules-grid">
            <li>Ensure you are sitting in a well-lit room facing the camera.</li>
            <li>Do not switch tabs or minimize the browser during the assessment.</li>
            <li>Multiple face detections or unrecognized noise will flag your attempt.</li>
            <li>Dual-monitor setups must be disconnected before starting.</li>
          </ul>
        </section>

        {/* Pre-exam checklist */}
        <section className="tips-section">
          <h3>
            <FaLightbulb className="tips-icon" /> Pre-Exam Checklist
          </h3>
          <div className="tips-grid">
            <div className="tip-item">
              <span className="tip-num">1</span>
              <p>Run the camera &amp; microphone test from the top bar.</p>
            </div>
            <div className="tip-item">
              <span className="tip-num">2</span>
              <p>Use a stable internet connection and keep your charger plugged in.</p>
            </div>
            <div className="tip-item">
              <span className="tip-num">3</span>
              <p>Close all other apps, tabs and screen-sharing tools.</p>
            </div>
            <div className="tip-item">
              <span className="tip-num">4</span>
              <p>Keep a valid photo ID nearby and your profile updated.</p>
            </div>
          </div>
        </section>

        {/* ===================== Exam History & Telemetry ===================== */}
        <section id="history-section" className="exam-history-section">
          <div className="section-title-row">
            <div>
              <h2>Exam History &amp; Telemetry</h2>
              <p>Review past scores, detailed metrics, and certification status.</p>
            </div>

            <div className="history-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === "all"}
                className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                All ({results.length})
              </button>
              <button
                role="tab"
                aria-selected={activeTab === "pass"}
                className={`tab-btn ${activeTab === "pass" ? "active" : ""}`}
                onClick={() => setActiveTab("pass")}
              >
                Passed ({passedExams})
              </button>
              <button
                role="tab"
                aria-selected={activeTab === "fail"}
                className={`tab-btn ${activeTab === "fail" ? "active" : ""}`}
                onClick={() => setActiveTab("fail")}
              >
                Failed ({failedExams})
              </button>
            </div>
          </div>

          {/* History Filters & Sort Toolbar */}
          <div className="history-toolbar">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by exam title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search exam history"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <div className="sort-wrap">
              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort exam history"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Highest score</option>
                <option value="lowest">Lowest score</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-history">
              <span className="spinner"></span>
              <p>Loading exam records...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="empty-history">
              <FaClipboardList className="empty-hist-icon" />
              <h3>No exam records found</h3>
              <p>
                {results.length === 0
                  ? "You haven't completed any proctored assessments yet."
                  : "No records match your current filter or search criteria."}
              </p>
            </div>
          ) : (
            <div className="history-cards-grid">
              {filteredResults.map((item, idx) => {
                const resultId = item._id || item.id || item.resultId || idx;
                const title = item.examTitle || item.title || "Technical Assessment";
                const passed = isPassedStatus(item.status);
                const dateStr = item.completedAt || item.submittedAt || item.createdAt || item.date;
                const formattedDate = dateStr
                  ? new Date(dateStr).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "Recent";

                const { score, totalQ, percentage } = getExamMetrics(item);

                return (
                  <div key={resultId} className={`history-card ${passed ? "passed" : "failed"}`}>
                    <div className="hc-top">
                      <div className="hc-title-block">
                        <h4>{title}</h4>
                        <span className={`status-badge ${passed ? "pass" : "fail"}`}>
                          {passed ? <FaCheckCircle /> : <FaTimesCircle />}
                          {passed ? "PASS" : "FAIL"}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="delete-record-btn"
                        onClick={(e) => handleDeleteResult(e, resultId, title)}
                        title="Delete exam record"
                        aria-label={`Delete record for ${title}`}
                        disabled={deletingId === resultId}
                      >
                        {deletingId === resultId ? <span className="spinner-mini"></span> : <FaTrashAlt />}
                      </button>
                    </div>

                    <div className="hc-metrics">
                      <div className="metric-box">
                        <span>SCORE</span>
                        <strong>
                          {score}/{totalQ}
                        </strong>
                      </div>
                      <div className="metric-box">
                        <span>PERCENTAGE</span>
                        <strong>{percentage}%</strong>
                      </div>
                    </div>

                    <div className="hc-progress-bar">
                      <div
                        className={`hc-progress-fill ${passed ? "pass" : "fail"}`}
                        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                      ></div>
                    </div>

                    <div className="hc-footer">
                      <span className="hc-date">
                        <FaClock /> Taken: {formattedDate}
                      </span>
                      <button type="button" className="hc-details-btn" onClick={() => openDetails(item)}>
                        View Details <FaArrowRight />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="dash-footer">
          <p>&copy; {new Date().getFullYear()} ProctorPortal. All rights reserved.</p>
          <p>AI-assisted proctoring • Your session is monitored for exam integrity</p>
        </footer>
      </div>

      {/* ===================== VIEW DETAILS MODAL ===================== */}
      {selectedResult && (
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && closeDetails()}>
          <div className="modal-content exam-details-modal" role="dialog" aria-modal="true" aria-label="Exam details">
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>{activeDetail.examTitle || activeDetail.title || "Assessment Details"}</h3>
                <span className={`status-badge ${isPassedStatus(activeDetail.status) ? "pass" : "fail"}`}>
                  {isPassedStatus(activeDetail.status) ? <FaCheckCircle /> : <FaTimesCircle />}
                  {isPassedStatus(activeDetail.status) ? "PASS" : "FAIL"} — {detailMetrics.percentage}%
                </span>
              </div>
              <button className="modal-close" onClick={closeDetails} aria-label="Close details">
                <FaTimes />
              </button>
            </div>

            <div className="modal-body exam-details-body">
              {/* Summary tiles */}
              <div className="details-summary-grid">
                <div className="summary-tile">
                  <span>Score</span>
                  <strong>
                    {detailMetrics.score} / {detailMetrics.totalQ}
                  </strong>
                </div>
                <div className="summary-tile">
                  <span>Percentage</span>
                  <strong>{detailMetrics.percentage}%</strong>
                </div>
                <div className="summary-tile">
                  <span>Completed</span>
                  <strong>
                    {detailCompletedAt
                      ? new Date(detailCompletedAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "N/A"}
                  </strong>
                </div>
                {detailDuration ? (
                  <div className="summary-tile">
                    <span>Time Taken</span>
                    <strong>{typeof detailDuration === "number" ? `${detailDuration} min` : String(detailDuration)}</strong>
                  </div>
                ) : null}
                {detailViolations !== null && detailViolations !== undefined && (
                  <div className="summary-tile">
                    <span>Proctor Flags</span>
                    <strong>{String(detailViolations)}</strong>
                  </div>
                )}
              </div>

              <div className="details-accuracy">
                <div className="accuracy-head">
                  <span>Overall performance</span>
                  <strong>{detailMetrics.percentage}%</strong>
                </div>
                <div className="hc-progress-bar">
                  <div
                    className={`hc-progress-fill ${isPassedStatus(activeDetail.status) ? "pass" : "fail"}`}
                    style={{ width: `${Math.min(100, Math.max(0, detailMetrics.percentage))}%` }}
                  ></div>
                </div>
              </div>

              <h4 className="qa-section-title">Question &amp; Answer Review</h4>

              {detailLoading ? (
                <div className="loading-history">
                  <span className="spinner"></span>
                  <p>Loading question details...</p>
                </div>
              ) : reviewQuestions.length > 0 ? (
                <>
                  <div className="review-filters">
                    {[
                      { key: "all", label: "All", count: reviewCounts.total },
                      { key: "correct", label: "Correct", count: reviewCounts.correct },
                      { key: "incorrect", label: "Incorrect", count: reviewCounts.incorrect },
                      { key: "skipped", label: "Skipped", count: reviewCounts.skipped },
                    ].map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        className={`review-filter ${f.key} ${reviewFilter === f.key ? "active" : ""}`}
                        onClick={() => setReviewFilter(f.key)}
                      >
                        {f.label} <span>{f.count}</span>
                      </button>
                    ))}
                  </div>

                  <div className="qa-list">
                    {visibleReview.length === 0 ? (
                      <div className="no-qa-data">
                        <p>No questions in this category.</p>
                      </div>
                    ) : (
                      visibleReview.map((q) => {
                        const state = !q.answered ? "skipped" : q.isCorrect ? "correct" : "incorrect";
                        return (
                          <div key={q.number} className={`qa-item ${state}`}>
                            <div className="qa-header">
                              <span className="qa-num">Question {q.number}</span>
                              <span className={`qa-status-pill ${state}`}>
                                {state === "correct" && <FaCheckCircle />}
                                {state === "incorrect" && <FaTimesCircle />}
                                {state === "skipped" && <FaMinusCircle />}
                                {state === "correct" ? "Correct" : state === "incorrect" ? "Incorrect" : "Not answered"}
                              </span>
                            </div>

                            <p className={`qa-question-text ${q.question ? "" : "missing"}`}>
                              {q.question || "The text of this question could not be loaded."}
                            </p>

                            {q.options.length > 0 && (
                              <ul className="options-review-list">
                                {q.options.map((opt, optIdx) => {
                                  const isUserChoice = q.given.index === optIdx;
                                  const isRightChoice = q.correct.index === optIdx;
                                  let optClass = "";
                                  if (isRightChoice) optClass = "right-option";
                                  else if (isUserChoice) optClass = "wrong-option";

                                  return (
                                    <li key={optIdx} className={`option-review-chip ${optClass}`}>
                                      <span className="opt-marker">{String.fromCharCode(65 + optIdx)}.</span>
                                      <span className="opt-text">{toText(opt)}</span>
                                      {isRightChoice && !isUserChoice && <span className="badge-right">Correct answer</span>}
                                      {isUserChoice && !isRightChoice && <span className="badge-user">Your answer</span>}
                                      {isUserChoice && isRightChoice && <span className="badge-right">Your answer ✓</span>}
                                    </li>
                                  );
                                })}
                              </ul>
                            )}

                            <div className="qa-answer-rows">
                              <div className={`answer-row given ${state}`}>
                                <span>Your answer</span>
                                <strong>{q.answered ? q.given.text : "Not answered"}</strong>
                              </div>
                              <div className="answer-row correct-row">
                                <span>Correct answer</span>
                                <strong>{q.correct.text || "Not available"}</strong>
                              </div>
                            </div>

                            {q.explanation && (
                              <div className="qa-explanation">
                                <FaLightbulb /> <span>{q.explanation}</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                <div className="no-qa-data">
                  <FaClipboardList className="empty-hist-icon" />
                  <p>
                    Detailed question responses are not available for this record, but your final score has been
                    saved.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={closeDetails}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== UPDATE PROFILE MODAL ===================== */}
      {isProfileModalOpen && (
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setIsProfileModalOpen(false)}>
          <div className="modal-content" role="dialog" aria-modal="true" aria-label="Update profile">
            <div className="modal-header">
              <h3>
                <FaUserEdit /> Update Candidate Profile
              </h3>
              <button className="modal-close" onClick={() => setIsProfileModalOpen(false)} aria-label="Close">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleProfileSubmit} className="modal-form">
              {modalMessage.text && <div className={`modal-alert ${modalMessage.type}`}>{modalMessage.text}</div>}

              <div className="profile-photo-upload-section">
                <div className="upload-avatar-preview">
                  {profileData.photoPreview ? (
                    <img src={profileData.photoPreview} alt="Avatar preview" />
                  ) : (
                    <span>{profileData.name ? profileData.name.charAt(0).toUpperCase() : "C"}</span>
                  )}
                </div>
                <div className="upload-controls">
                  <label htmlFor="avatar-file-input" className="btn-secondary upload-label-btn">
                    <FaUpload /> Change Photo
                  </label>
                  <input
                    id="avatar-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: "none" }}
                  />
                  <small>Max size {MAX_PHOTO_SIZE_MB}MB (JPG/PNG)</small>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" name="name" value={profileData.name} onChange={handleProfileChange} required />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" name="email" value={profileData.email} onChange={handleProfileChange} required />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="text" name="phone" value={profileData.phone} onChange={handleProfileChange} />
                </div>
                <div className="form-group">
                  <label>Alternative Phone</label>
                  <input type="text" name="altPhone" value={profileData.altPhone} onChange={handleProfileChange} />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="date" name="dob" value={profileData.dob} onChange={handleProfileChange} />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" value={profileData.gender} onChange={handleProfileChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <input type="text" name="address" value={profileData.address} onChange={handleProfileChange} />
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label>District / City</label>
                  <input type="text" name="district" value={profileData.district} onChange={handleProfileChange} />
                </div>
                <div className="form-group">
                  <label>State / Province</label>
                  <input type="text" name="state" value={profileData.state} onChange={handleProfileChange} />
                </div>
                <div className="form-group">
                  <label>Pincode</label>
                  <input type="text" name="pincode" value={profileData.pincode} onChange={handleProfileChange} />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsProfileModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <span className="spinner"></span> : <FaSave />} Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== CHANGE PASSWORD MODAL ===================== */}
      {isPasswordModalOpen && (
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setIsPasswordModalOpen(false)}>
          <div className="modal-content password-modal" role="dialog" aria-modal="true" aria-label="Change password">
            <div className="modal-header">
              <h3>
                <FaKey /> Change Password
              </h3>
              <button className="modal-close" onClick={() => setIsPasswordModalOpen(false)} aria-label="Close">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="modal-form">
              {modalMessage.text && <div className={`modal-alert ${modalMessage.type}`}>{modalMessage.text}</div>}

              <div className="form-group">
                <label>Current Password</label>
                <div className="password-input-wrap">
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>New Password (min 8 chars)</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
              </div>

              <div className="password-toggle-row">
                <button
                  type="button"
                  className="toggle-pass-visibility"
                  onClick={() => setShowPasswords(!showPasswords)}
                >
                  {showPasswords ? <FaEyeSlash /> : <FaEye />} {showPasswords ? "Hide Passwords" : "Show Passwords"}
                </button>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsPasswordModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <span className="spinner"></span> : <FaKey />} Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
