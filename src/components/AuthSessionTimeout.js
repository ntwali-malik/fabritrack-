import React, { useRef, useState, useEffect } from "react";
import SessionTimeoutModal from "./SessionTimeoutModal";

const IDLE_MS = 2 * 60 * 1000; // 2 minutes
const COUNTDOWN_SECONDS = 10;  // show modal and count down 10 seconds before logout

/**
 * Wraps authenticated content and enforces session timeout after 2 min of inactivity.
 * Shows a countdown modal when idle time is reached; any activity or "Stay logged in" resets the timer.
 */
export default function AuthSessionTimeout({ children, onLogout }) {
  const lastActivityRef = useRef(Date.now());
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  // Reset activity timestamp and close modal on user interaction
  const handleActivity = () => {
    lastActivityRef.current = Date.now();
    setShowModal(false);
    setCountdown(COUNTDOWN_SECONDS);
  };

  // Global activity listeners (attach once; handler always resets timer and closes modal)
  useEffect(() => {
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    events.forEach((ev) => window.addEventListener(ev, handleActivity));
    return () => events.forEach((ev) => window.removeEventListener(ev, handleActivity));
  }, []);

  // Timer: every second, check idle time; if >= 2 min show modal and count down
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const idleMs = now - lastActivityRef.current;

      if (showModal) {
        setCountdown((s) => {
          if (s <= 1) {
            onLogout();
            return 0;
          }
          return s - 1;
        });
      } else if (idleMs >= IDLE_MS) {
        setShowModal(true);
        setCountdown(COUNTDOWN_SECONDS);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [showModal, onLogout]);

  const handleStayLoggedIn = () => {
    lastActivityRef.current = Date.now();
    setShowModal(false);
    setCountdown(COUNTDOWN_SECONDS);
  };

  return (
    <>
      {children}
      <SessionTimeoutModal
        open={showModal}
        countdownSeconds={countdown}
        onStayLoggedIn={handleStayLoggedIn}
      />
    </>
  );
}
