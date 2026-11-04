import React, { useEffect, useRef, useState } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import "./FaceDetection.css";

function FaceDetection({ videoRef, onWarning }) {
  const detectorRef = useRef(null);
  const intervalRef = useRef(null);

  // Separate timers for different violation conditions
  const noFaceTimer = useRef(null);
  const multiFaceTimer = useRef(null);

  // Per-violation type cooldown tracker
  const lastWarningTimestamp = useRef({
    NO_FACE: 0,
    MULTIPLE_FACES: 0
  });

  const [status, setStatus] = useState("Initializing AI...");

  useEffect(() => {
    initializeDetector();

    // Clean up all active intervals and timeouts on component unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearNoFaceTimer();
      clearMultipleFaceTimer();
    };
  }, []);

  // Initialize MediaPipe Model
  const initializeDetector = async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );

      const detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite"
        },
        runningMode: "VIDEO"
      });

      detectorRef.current = detector;
      setStatus("AI Monitoring Active");
      startDetection();
    } catch (error) {
      console.error("Face detector initialization error:", error);
      setStatus("AI Failed");
    }
  };

  // Start continuous frame inspection interval
  const startDetection = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      detectFace();
    }, 800);
  };

  const detectFace = () => {
    if (
      !videoRef.current ||
      !videoRef.current.video ||
      videoRef.current.video.readyState !== 4 ||
      !detectorRef.current
    ) {
      return;
    }

    const video = videoRef.current.video;

    try {
      const result = detectorRef.current.detectForVideo(
        video,
        performance.now()
      );

      const faces = result.detections || [];
      const faceCount = faces.length;

      // =========================
      // CASE 1: NO FACE DETECTED
      // =========================
      if (faceCount === 0) {
        setStatus("Face Not Detected");
        clearMultipleFaceTimer();
        startNoFaceTimer("Face not detected in camera frame!");
        return;
      } else {
        clearNoFaceTimer();
      }

      // =========================
      // CASE 2: MULTIPLE FACES
      // =========================
      if (faceCount > 1) {
        setStatus(`Multiple Faces Detected (${faceCount})`);
        clearNoFaceTimer();
        startMultipleFaceTimer(`Multiple people (${faceCount}) detected in video feed!`);
        return;
      } else {
        clearMultipleFaceTimer();
      }

      // =========================
      // CASE 3: SINGLE FACE VERIFIED
      // =========================
      if (faceCount === 1) {
        setStatus("Face Verified");
      }
    } catch (err) {
      console.error("Frame processing error:", err);
    }
  };

  // =========================
  // WARNING TIMER HANDLERS
  // =========================

  const startNoFaceTimer = (message) => {
    if (noFaceTimer.current) return;

    noFaceTimer.current = setTimeout(() => {
      sendWarning(message, "NO_FACE");
      noFaceTimer.current = null;
    }, 2500); // Trigger warning if face is absent for 2.5 seconds
  };

  const clearNoFaceTimer = () => {
    if (noFaceTimer.current) {
      clearTimeout(noFaceTimer.current);
      noFaceTimer.current = null;
    }
  };

  const startMultipleFaceTimer = (message) => {
    if (multiFaceTimer.current) return;

    multiFaceTimer.current = setTimeout(() => {
      sendWarning(message, "MULTIPLE_FACES");
      multiFaceTimer.current = null;
    }, 2000); // Trigger warning if multiple faces persist for 2 seconds
  };

  const clearMultipleFaceTimer = () => {
    if (multiFaceTimer.current) {
      clearTimeout(multiFaceTimer.current);
      multiFaceTimer.current = null;
    }
  };

  const sendWarning = (message, type) => {
    const now = Date.now();
    const lastTime = lastWarningTimestamp.current[type] || 0;

    // Apply 4-second cooldown per specific violation type
    if (now - lastTime < 4000) return;

    lastWarningTimestamp.current[type] = now;

    if (onWarning) {
      onWarning(message, type);
    }
  };

  return (
    <div className="face-status">
      <h4>AI Face Monitoring</h4>
      <p className={`status-text ${status.includes("Verified") ? "verified" : "warning"}`}>
        {status}
      </p>
    </div>
  );
}

export default FaceDetection;