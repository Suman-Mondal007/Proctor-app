import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaClock,
  FaClipboardList,
  FaCheckCircle,
  FaTimesCircle,
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

function Dashboard() {
  const { user, logout, updateUserProfile, changeUserPassword } = useAuth();
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
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

  // Extract avatar URL with fallbacks (Base64, photoUrl, or photo)
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

  // 2. Keep local profileData state synchronized whenever `user` changes
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

  // Live Clock Effect
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

  // Escape key closes modals / menus
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setIsProfileModalOpen(false);
        setIsPasswordModalOpen(false);
        setMenuOpen(false);
        setMobileNavOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Lock body scroll while a modal is open
  useEffect(() => {
    const locked = isProfileModalOpen || isPasswordModalOpen;
    document.body.style.overflow = locked ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isProfileModalOpen, isPasswordModalOpen]);

  // Release object URLs to avoid memory leaks
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

  // Navbar section scrolling
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

  // Profile input change handler
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Photo Upload
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

  // Submit Profile Form
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

  // Handle Password Submit
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

  // Results sorted newest first (so "latest" is truly the latest)
  const resultsNewestFirst = useMemo(
    () => [...results].sort((a, b) => getResultDate(b) - getResultDate(a)),
    [results]
  );

  // Metrics calculations
  const totalExams = results.length;
  const passedExams = results.filter((r) => isPassedStatus(r.status)).length;
  const latest = resultsNewestFirst[0];
  const latestScore = latest ? latest.percentage || 0 : 0;
  const averageScore =
    totalExams > 0
      ? Math.round(results.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / totalExams)
      : 0;
  const bestScore = totalExams > 0 ? Math.max(...results.map((r) => r.percentage || 0)) : 0;
  const passRate = totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0;

  // Profile completion
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

  // Filtered + searched + sorted history
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

    const pct = (r) => r.percentage ?? 0;
    if (sortBy === "oldest") list.sort((a, b) => getResultDate(a) - getResultDate(b));
    if (sortBy === "highest") list.sort((a, b) => pct(b) - pct(a));
    if (sortBy === "lowest") list.sort((a, b) => pct(a) - pct(b));
    return list;
  }, [resultsNewestFirst, activeTab, searchTerm, sortBy]);

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
            <Link
              to="/available-exams"
              className="mobile-nav-item"
              onClick={() => setMobileNavOpen(false)}
            >
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
              <span className="card-sub">
                {latest ? `Status: ${latest.status}` : "No attempts recorded"}
              </span>
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
              <p>Keep a valid photo ID nearby and your profile up to date.</p>
            </div>
          </div>
        </section>

        {/* History Section */}
        <section className="history-section" id="history-section">
          <div className="history-header">
            <div>
              <h2>Exam History & Telemetry</h2>
              <p className="history-sub">Review past scores, detailed metrics, and certification status.</p>
            </div>

            <div className="history-filter-tabs">
              <button
                className={`filter-btn ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                All ({results.length})
              </button>
              <button
                className={`filter-btn ${activeTab === "pass" ? "active" : ""}`}
                onClick={() => setActiveTab("pass")}
              >
                Passed ({results.filter((r) => isPassedStatus(r.status)).length})
              </button>
              <button
                className={`filter-btn ${activeTab === "fail" ? "active" : ""}`}
                onClick={() => setActiveTab("fail")}
              >
                Failed ({results.filter((r) => !isPassedStatus(r.status)).length})
              </button>
            </div>
          </div>

          <div className="history-controls">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by exam title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="sort-box">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Highest score</option>
                <option value="lowest">Lowest score</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="history-loading">
              <span className="spinner"></span> Loading exam history...
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="no-history-card">
              <FaHistory className="no-history-icon" />
              <h4>No exam records found</h4>
              <p>Take an assessment to view your score history and performance metrics.</p>
              <Link to="/available-exams" className="btn-primary">
                Browse Available Exams
              </Link>
            </div>
          ) : (
            <div className="history-grid">
              {filteredResults.map((item) => {
                const recordId = item._id || item.id || item.resultId;
                const title = item.examTitle || item.title || "Technical Assessment";
                const passed = isPassedStatus(item.status);
                const score = item.score ?? item.percentage ?? 0;
                const correctCount = item.correctAnswers ?? Math.round((score / 100) * 5);
                const totalCount = item.totalQuestions ?? 5;
                const dateString = item.completedAt || item.submittedAt || item.createdAt || item.date;
                const formattedDate = dateString
                  ? new Date(dateString).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "Recent";

                return (
                  <div className="history-card" key={recordId}>
                    <div className="history-card-header">
                      <h4>{title}</h4>
                      {/* <button
                        className="delete-record-btn"
                        onClick={(e) => handleDeleteResult(e, recordId, title)}
                        title="Delete exam record"
                        disabled={deletingId === recordId}
                      >
                        {deletingId === recordId ? <span className="spinner-mini"></span> : <FaTrashAlt />}
                      </button> */}

                      <button
  className="delete-record-btn"
  onClick={(e) => handleDeleteResult(e, recordId, title)}
  title="Delete exam record"
  disabled={deletingId === recordId}
>
  {deletingId === recordId ? (
    <span className="spinner-mini"></span>
  ) : (
    <span style={{ fontSize: "0.95rem", lineHeight: 1 }}>🗑️</span>
  )}
</button>
                      
                    </div>

                    <div className="history-status-badge-row">
                      <span className={`history-status-pill ${passed ? "pass" : "fail"}`}>
                        {passed ? <FaCheckCircle /> : <FaTimesCircle />} {item.status || (passed ? "PASSED" : "FAILED")}
                      </span>
                    </div>

                    <div className="history-score-metrics">
                      <div>
                        <span>Score</span>
                        <strong>
                          {correctCount}/{totalCount}
                        </strong>
                      </div>
                      <div>
                        <span>Percentage</span>
                        <strong className={passed ? "text-success" : "text-danger"}>{score}%</strong>
                      </div>
                    </div>

                    {score > 0 && (
                      <div className="history-score-bar-bg">
                        <div
                          className={`history-score-bar-fill ${passed ? "pass" : "fail"}`}
                          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                        ></div>
                      </div>
                    )}

                    <div className="history-card-footer">
                      <span className="history-date">
                        <FaClock /> Taken: {formattedDate}
                      </span>
                      <Link to={`/result/${recordId}`} className="history-detail-link">
                        View Details <FaArrowRight />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ===================== Update Profile Modal ===================== */}
      {isProfileModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsProfileModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <FaUserEdit /> Update Candidate Profile
              </h3>
              <button className="modal-close-btn" onClick={() => setIsProfileModalOpen(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleProfileSubmit} className="modal-form">
              {modalMessage.text && (
                <div className={`modal-alert ${modalMessage.type}`}>{modalMessage.text}</div>
              )}

              <div className="profile-photo-upload-row">
                <div className="user-avatar-mini large modal-avatar-preview">
                  {profileData.photoPreview ? (
                    <img src={profileData.photoPreview} alt="Preview" className="avatar-img-mini" />
                  ) : (
                    (profileData.name || "C").charAt(0).toUpperCase()
                  )}
                </div>
                <div className="upload-controls">
                  <label htmlFor="photo-upload-input" className="btn-secondary upload-btn-label">
                    <FaUpload /> Choose Photo
                  </label>
                  <input
                    id="photo-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: "none" }}
                  />
                  <span className="upload-hint">Max size {MAX_PHOTO_SIZE_MB}MB (JPG/PNG)</span>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="form-group">
                  <label>Alternate Phone</label>
                  <input
                    type="text"
                    name="altPhone"
                    value={profileData.altPhone}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={profileData.dob}
                    onChange={handleProfileChange}
                  />
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
                <input
                  type="text"
                  name="address"
                  value={profileData.address}
                  onChange={handleProfileChange}
                />
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label>District</label>
                  <input
                    type="text"
                    name="district"
                    value={profileData.district}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="state"
                    value={profileData.state}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="form-group">
                  <label>Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={profileData.pincode}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsProfileModalOpen(false)}
                >
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

      {/* ===================== Change Password Modal ===================== */}
      {isPasswordModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsPasswordModalOpen(false)}>
          <div className="modal-box password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <FaKey /> Change Password
              </h3>
              <button className="modal-close-btn" onClick={() => setIsPasswordModalOpen(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="modal-form">
              {modalMessage.text && (
                <div className={`modal-alert ${modalMessage.type}`}>{modalMessage.text}</div>
              )}

              <div className="form-group">
                <label>Current Password</label>
                <div className="password-input-wrap">
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>New Password (min 8 characters)</label>
                <div className="password-input-wrap">
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData((p) => ({ ...p, newPassword: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <div className="password-input-wrap">
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="show-pass-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showPasswords}
                    onChange={() => setShowPasswords((s) => !s)}
                  />
                  <span>Show passwords</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsPasswordModalOpen(false)}
                >
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

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>&copy; 2026 ProctorPortal. All rights reserved.</p>
        <p>AI-assisted proctoring • Your session is monitored for exam integrity.</p>
      </footer>
    </div>
  );
}

export default Dashboard;