import React, { useState, useEffect } from 'react';
import './Banner.css';

const Banner = ({ message, type = 'error', duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div className={`banner banner-${type}`}>
      <div className="banner-content">
        <span className="banner-message">{message}</span>
        <button className="banner-close" onClick={handleClose}>
          ✕
        </button>
      </div>
    </div>
  );
};

export default Banner;
