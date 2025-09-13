// Koala Mood Utility Functions
// Determines koala's mood based on user's flashcard accuracy

export const KOALA_MOODS = {
  HAPPY: 'happy',
  SAD: 'sad'
};

export const ACCURACY_THRESHOLD = 80; // 80% accuracy threshold

/**
 * Calculate koala mood based on accuracy percentage
 * @param {number} accuracy - Accuracy percentage (0-100)
 * @returns {string} - 'happy' or 'sad'
 */
export const calculateKoalaMood = (accuracy) => {
  return accuracy >= ACCURACY_THRESHOLD ? KOALA_MOODS.HAPPY : KOALA_MOODS.SAD;
};

/**
 * Get the appropriate koala image path based on mood
 * @param {string} mood - 'happy' or 'sad'
 * @returns {string} - Path to koala image
 */
export const getKoalaImage = (mood) => {
  switch (mood) {
    case KOALA_MOODS.HAPPY:
      return 'assets/icons/koala-happy.png';
    case KOALA_MOODS.SAD:
      return 'assets/icons/koala-sad.png';
    default:
      return 'assets/icons/koala-happy.png'; // Default to happy
  }
};

/**
 * Get a motivational message based on koala mood and stats
 * @param {string} mood - 'happy' or 'sad'
 * @param {Object} stats - User statistics
 * @returns {string} - Motivational message
 */
export const getKoalaMessage = (mood, stats) => {
  const { accuracy, streak, bestStreak } = stats;
  
  if (mood === KOALA_MOODS.HAPPY) {
    if (streak > 5) {
      return `🐨 Amazing! ${streak} in a row! Keep it up!`;
    } else if (accuracy >= 90) {
      return `🐨 Excellent work! ${accuracy}% accuracy!`;
    } else {
      return `🐨 Great job! You're doing well!`;
    }
  } else {
    if (streak === 0 && accuracy < 50) {
      return `🐨 Don't give up! Practice makes perfect!`;
    } else if (accuracy < 60) {
      return `🐨 Keep studying! You can do better!`;
    } else {
      return `🐨 Almost there! Just a bit more practice!`;
    }
  }
};

/**
 * Get CSS class for koala mood styling
 * @param {string} mood - 'happy' or 'sad'
 * @returns {string} - CSS class name
 */
export const getKoalaMoodClass = (mood) => {
  return `koala-${mood}`;
};
