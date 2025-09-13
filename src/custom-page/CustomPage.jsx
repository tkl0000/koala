import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import './custom-page.css';

const CustomPage = () => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [time, setTime] = useState(new Date());
  const [flashcard, setFlashcard] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState(null);
  const [showAnswerInput, setShowAnswerInput] = useState(false);
  const [allowContinue, setAllowContinue] = useState(false);
  const [answerSectionClass, setAnswerSectionClass] = useState('answer-input-section');
  const [score, setScore] = useState(0);
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  useEffect(() => {
    // Get the original URL from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const original = urlParams.get('original') || 'Unknown';
    setOriginalUrl(original);

    // Load flashcard and score from storage
    loadFlashcard();
    loadScore();

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

  const loadScore = () => {
    chrome.storage.sync.get(['score'], (result) => {
      setScore(result.score || 0);
    });
  };

  const updateScore = (isCorrect) => {
    const newScore = isCorrect ? score + 1 : score - 1;
    setScore(newScore);
    chrome.storage.sync.set({ score: newScore }, () => {
      console.log('Score updated:', newScore);
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
        setUserAnswer(''); // Reset user answer
        setGradeResult(null); // Reset grade result
        setShowAnswerInput(false); // Reset answer input visibility
        setAnswerSectionClass('answer-input-section'); // Reset answer section background
      }
    });
  };

  const handleShowAnswerInput = () => {
    setShowAnswerInput(true);
    setGradeResult(null);
  };

  const gradeAnswer = async () => {
    if (!userAnswer.trim()) {
      alert('Please enter an answer before grading');
      return;
    }

    setIsGrading(true);
    
    try {
      // Use API key from environment variable
      const apiKey = GEMINI_API_KEY;
      // console.log('Key:', apiKey);
      
      if (!apiKey) {
        alert('Please set your GEMINI_API_KEY environment variable');
        setIsGrading(false);
        return;
      }

      // Initialize Google GenAI
      const ai = new GoogleGenAI({apiKey: apiKey});

      const prompt = `You are a helpful tutor grading a student's answer. Please grade the following:

Question: "${flashcard.front}"
Correct Answer: "${flashcard.back}"
Student's Answer: "${userAnswer}"

Please provide:
1. A grade (A, B, C, D, or F)
2. A brief explanation of why this grade was given
3. Constructive feedback to help the student improve

Format your response as:
Grade: [A/B/C/D/F]
Explanation: [Brief explanation]
Feedback: [Constructive feedback]`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      const generatedText = response.text;
      
      // Parse the response
      const gradeMatch = generatedText.match(/Grade:\s*([A-F])/i);
      const explanationMatch = generatedText.match(/Explanation:\s*([^\n]+)/i);
      const feedbackMatch = generatedText.match(/Feedback:\s*([^\n]+)/i);
      
      setGradeResult({
        grade: gradeMatch ? gradeMatch[1].toUpperCase() : 'N/A',
        explanation: explanationMatch ? explanationMatch[1] : 'No explanation provided',
        feedback: feedbackMatch ? feedbackMatch[1] : 'No feedback provided',
        fullResponse: generatedText
      });

      const grade = gradeMatch ? gradeMatch[1].toUpperCase() : 'N/A';
      if (grade === 'A' || grade === 'B' || grade === 'C') {
        setAllowContinue(true);
        setAnswerSectionClass('answer-input-section bg-success'); // Green for correct
        updateScore(true); // Increment score for correct answer
      } else {
        setAllowContinue(false);
        setAnswerSectionClass('answer-input-section bg-failure'); // Red for wrong
        updateScore(false); // Decrement score for wrong answer
      }
    } catch (error) {
      console.error('Error grading answer:', error);
      setGradeResult({
        grade: 'Error',
        explanation: 'Failed to grade answer',
        feedback: 'Please check your API key and try again',
        fullResponse: error.message
      });
    } finally {
      setIsGrading(false);
    }
  };

  const resetCard = () => {
    setUserAnswer('');
    setGradeResult(null);
    setShowAnswerInput(false);
    setIsFlipped(false);
    setAnswerSectionClass('answer-input-section'); // Reset answer section background
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
        <h1>🐨 Koala Extension Intercepted!</h1>
        {/* <p>This page was loaded by the Koala Chrome Extension</p> */}
        <p>Time for a study session twin</p>
        {/* <div className="score-display">
          <span className="score-label">Score:</span>
          <span className={`score-value ${score >= 0 ? 'positive' : 'negative'}`}>
            {score}
          </span>
        </div> */}
      </div>

      <div className="custom-content">
        <div className="info-card">
          <h2>📚 Flashcard</h2>
          {flashcard && (
            <div className="flashcard-container">
              <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
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
                {/* <button onClick={handleFlip} className="flashcard-btn">
                  {isFlipped ? 'Show Front' : 'Show Back'}
                </button> */}
                {/* <button onClick={handleNextCard} className="flashcard-btn secondary">
                  Next Card
                </button> */}
                {/* <button onClick={handleShowAnswerInput} className="flashcard-btn secondary">
                  Try Answer
                </button> */}
                <div className={`${answerSectionClass} w-full flex flex-row`}>
                  {/* <h4>Enter Your Answer:</h4> */}
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="answer-input"
                    rows="3"
                  />
                  <button 
                    onClick={gradeAnswer} 
                    className="grade-btn"
                    disabled={isGrading}
                  >
                    {isGrading ? 'Grading...' : 'Check'}
                  </button>
                  <button onClick={resetCard} className="reset-btn">
                    Reset
                  </button>
                </div>
              </div>

              {/* {showAnswerInput && (
                <div className="answer-input-section">
                  <h4>Enter Your Answer:</h4>
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="answer-input"
                    rows="3"
                  />
                  <div className="answer-controls">
                    <button 
                      onClick={gradeAnswer} 
                      className="grade-btn"
                      disabled={isGrading}
                    >
                      {isGrading ? 'Grading...' : 'Grade Answer'}
                    </button>
                    <button onClick={resetCard} className="reset-btn">
                      Reset
                    </button>
                  </div>
                </div>
              )} */}

              {/* {gradeResult && (
                <div className="grade-result">
                  <div className={`grade-badge grade-${gradeResult.grade.toLowerCase()}`}>
                    Grade: {gradeResult.grade}
                  </div>
                  <div className="grade-details">
                    <div className="grade-explanation">
                      <strong>Explanation:</strong> {gradeResult.explanation}
                    </div>
                    <div className="grade-feedback">
                      <strong>Feedback:</strong> {gradeResult.feedback}
                    </div>
                  </div>
                  <button onClick={resetCard} className="try-again-btn">
                    Try Again
                  </button>
                </div>
              )} */}
            </div>
          )}
        </div>

        {allowContinue && (
        <div className="actions-card">
          {/* <h2>Quick Actions</h2> */}
          <div className="action-buttons">
            <button onClick={handleGoBack} className="action-btn primary">
              Continue
              {/* {allowContinue ? 'Yes' : 'No'} */}
            </button>
            {/* <button onClick={handleGoToGoogle} className="action-btn secondary">
              🔍 Go to Google
            </button>
            <button onClick={handleGoToGitHub} className="action-btn secondary">
              🐙 Go to GitHub
            </button> */}
            </div>
          </div>
        )}
      </div>

      <div className="custom-footer">
        <p>Powered by Koala</p>
      </div>
    </div>
  );
};

export default CustomPage;
