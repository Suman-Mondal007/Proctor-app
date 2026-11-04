import { useEffect, useRef } from "react";

function MobileDetection({ onWarning }) {
  const warned = useRef(false);

  useEffect(() => {
    const isMobileDevice = () => {
      const ua = navigator.userAgent.toLowerCase();

      const mobileUA =
        /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(
          ua
        );

      const mobileData =
        navigator.userAgentData &&
        navigator.userAgentData.mobile === true;

      const touchDevice =
        navigator.maxTouchPoints > 1 &&
        window.matchMedia("(pointer: coarse)").matches;

      return mobileUA || mobileData || touchDevice;
    };

    const checkDevice = () => {
      if (isMobileDevice() && !warned.current) {
        warned.current = true;

        if (onWarning) {
          onWarning(
            "Mobile or Tablet detected. Please use a Desktop/Laptop.",
            "MOBILE_DEVICE"
          );
        }
      }
    };

    checkDevice();

    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, [onWarning]);

  return null;
}

export default MobileDetection;