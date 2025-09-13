import React, { useState, useEffect } from 'react';
import './custom-page.css';

const CustomPage = () => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [time, setTime] = useState(new Date());
  const [flashcard, setFlashcard] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    // Get the original URL from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const original = urlParams.get('original') || 'Unknown';
    setOriginalUrl(original);

    // Load flashcard from storage
    loadFlashcard();

    // Update time every second
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadFlashcard = () => {
    chrome.storage.sync.get(['flashcards'], (result) => {
      const flashcards = result.flashcards || [];
      if (flashcards.length > 0) {
        // Get a random flashcard
        const randomIndex = Math.floor(Math.random() * flashcards.length);
        setFlashcard(flashcards[randomIndex]);
      } else {
        // Create a default flashcard if none exist
        const defaultFlashcard = {
          id: 1,
          front: "Welcome to Koala Extension!",
          back: "This is a flashcard feature. Add your own flashcards in the dashboard!",
          category: "Welcome"
        };
        setFlashcard(defaultFlashcard);
      }
    });
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNextCard = () => {
    chrome.storage.sync.get(['flashcards'], (result) => {
      const flashcards = result.flashcards || [];
      if (flashcards.length > 0) {
        const randomIndex = Math.floor(Math.random() * flashcards.length);
        setFlashcard(flashcards[randomIndex]);
        setIsFlipped(false); // Reset flip state for new card
      }
    });
  };

  const handleGoBack = () => {
    if (originalUrl && originalUrl !== 'Unknown') {
      // Add bypass parameter to prevent redirect loop
      const url = new URL(originalUrl);
      url.searchParams.set('koala_bypass', 'true');
      window.location.href = url.toString();
    } else {
      window.history.back();
    }
  };

  const handleGoToGoogle = () => {
    window.location.href = 'https://www.google.com';
  };

  const handleGoToGitHub = () => {
    window.location.href = 'https://github.com';
  };

  return (
    <div className="custom-page">
      <div className="custom-header">
        <h1>🦥 Koala Extension Intercepted!</h1>
        <p>This page was loaded by the Koala Chrome Extension</p>
      </div>

      <div className="custom-content">
        <div className="info-card">
          <h2>📚 Flashcard</h2>
          {flashcard && (
            <div className="flashcard-container">
              <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
                <div className="flashcard-front">
                  <div className="flashcard-content">
                    <h3>{flashcard.front}</h3>
                    {/* <p className="flashcard-category">{flashcard.category}</p> */}
                  </div>
                </div>
                <div className="flashcard-back">
                  <div className="flashcard-content">
                    <h3>{flashcard.back}</h3>
                    {/* <p className="flashcard-category">{flashcard.category}</p> */}
                  </div>
                </div>
              </div>
              <div className="flashcard-controls">
                <button onClick={handleFlip} className="flashcard-btn">
                  {isFlipped ? 'Show Front' : 'Show Back'}
                </button>
                <button onClick={handleNextCard} className="flashcard-btn secondary">
                  Next Card
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="actions-card">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button onClick={handleGoBack} className="action-btn primary">
              Continue to Original Site
            </button>
            {/* <button onClick={handleGoToGoogle} className="action-btn secondary">
              🔍 Go to Google
            </button>
            <button onClick={handleGoToGitHub} className="action-btn secondary">
              🐙 Go to GitHub
            </button> */}
          </div>
        </div>
      </div>

      <div className="custom-footer">
        <p>Powered by Koala Chrome Extension 🦥</p>
      </div>
    </div>
  );
};

export default CustomPage;
