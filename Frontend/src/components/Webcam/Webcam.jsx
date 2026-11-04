import React, { useRef, useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

function Webcam({ onWarning }) {
  const videoRef = useRef(null);
  const modelRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const lastDetectionTimeRef = useRef(0);

  const [modelLoaded, setModelLoaded] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState({
    personCount: 1,
    phoneDetected: false,
  });

  // 1. Initialize Webcam Feed
  useEffect(() => {
    let streamInstance = null;

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });
        streamInstance = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Webcam access error:", err);
      }
    };

    startWebcam();

    return () => {
      if (streamInstance) {
        streamInstance.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 2. Load COCO-SSD Model
  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        const loadedModel = await cocoSsd.load({ base: "lite_mobilenet_v2" });
        modelRef.current = loadedModel;
        setModelLoaded(true);
      } catch (error) {
        console.error("Failed to load object detection model:", error);
      }
    };

    loadModel();
  }, []);

  // 3. Scan Frame for Persons & Phones
  useEffect(() => {
    if (!modelLoaded) return;

    const detectObjects = async () => {
      if (
        videoRef.current &&
        videoRef.current.readyState === 4 &&
        modelRef.current
      ) {
        try {
          const predictions = await modelRef.current.detect(videoRef.current);

          // Count people in frame (confidence > 45%)
          const people = predictions.filter(
            (p) => p.class === "person" && p.score >= 0.45
          );

          // Check for mobile phone (confidence > 45%)
          const phoneDetected = predictions.some(
            (p) => p.class === "cell phone" && p.score >= 0.45
          );

          setDetectionStatus({
            personCount: people.length,
            phoneDetected: phoneDetected,
          });

          const now = Date.now();
          // 3.5-second cooldown between warning dispatches
          if (now - lastDetectionTimeRef.current > 3500) {
            if (phoneDetected) {
              lastDetectionTimeRef.current = now;
              onWarning(
                "Mobile phone detected in webcam feed!",
                "PHONE_IN_WEBCAM"
              );
            } else if (people.length === 0) {
              lastDetectionTimeRef.current = now;
              onWarning(
                "No candidate face detected in webcam!",
                "NO_FACE_DETECTED"
              );
            } else if (people.length > 1) {
              lastDetectionTimeRef.current = now;
              onWarning(
                "Multiple people detected in webcam feed!",
                "MULTIPLE_FACES"
              );
            }
          }
        } catch (err) {
          console.error("AI frame processing error:", err);
        }
      }
    };

    detectionIntervalRef.current = setInterval(detectObjects, 1000);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [modelLoaded, onWarning]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "220px", background: "#000", borderRadius: "8px", overflow: "hidden" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scaleX(-1)",
        }}
      />

      {/* Proctoring Live Status Overlay Bar */}
      <div
        style={{
          position: "absolute",
          top: "8px",
          left: "8px",
          right: "8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "6px",
          zIndex: 10,
        }}
      >
        {/* Face Status Badge */}
        <span
          style={{
            background:
              detectionStatus.personCount === 1
                ? "rgba(16, 185, 129, 0.85)"
                : "rgba(239, 68, 68, 0.85)",
            color: "#fff",
            fontSize: "11px",
            fontWeight: "bold",
            padding: "3px 8px",
            borderRadius: "4px",
            backdropFilter: "blur(4px)",
          }}
        >
          {detectionStatus.personCount === 1
            ? "✓ Face Verified"
            : detectionStatus.personCount === 0
            ? "⚠ No Face Detected"
            : "⚠ Multiple Faces"}
        </span>

        {/* Phone Status Badge */}
        <span
          style={{
            background: detectionStatus.phoneDetected
              ? "rgba(239, 68, 68, 0.9)"
              : "rgba(0, 0, 0, 0.5)",
            color: "#fff",
            fontSize: "11px",
            fontWeight: "bold",
            padding: "3px 8px",
            borderRadius: "4px",
            backdropFilter: "blur(4px)",
          }}
        >
          {detectionStatus.phoneDetected ? "🚨 Phone Detected!" : "📱 Phone: Clear"}
        </span>
      </div>

      {!modelLoaded && (
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            left: "8px",
            background: "rgba(0,0,0,0.7)",
            color: "#38bdf8",
            padding: "3px 8px",
            borderRadius: "4px",
            fontSize: "11px",
          }}
        >
          Initializing AI Proctoring...
        </div>
      )}
    </div>
  );
}

export default Webcam;