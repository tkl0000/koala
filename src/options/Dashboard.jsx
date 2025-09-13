import React, { useState, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";
import "./dashboard.css";

const Dashboard = () => {
  const [blockedSites, setBlockedSites] = useState([]);
  const [newSite, setNewSite] = useState("");
  const [stats, setStats] = useState({
    totalBlocked: 0,
    todayBlocked: 0,
    lastBlocked: null,
  });
  const [flashcards, setFlashcards] = useState([]);
  const [newFlashcard, setNewFlashcard] = useState({
    front: "",
    back: "",
    category: "",
  });
  const [isShaking, setIsShaking] = useState(false);
  const [score, setScore] = useState(0);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiCategory, setAiCategory] = useState("");
  const [isAiSectionOpen, setIsAiSectionOpen] = useState(false);
  const [isSitesDropdownOpen, setIsSitesDropdownOpen] = useState(false);
  const [selectedSites, setSelectedSites] = useState([]);
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load blocked sites and flashcards
    chrome.storage.sync.get(
      ["blockedSites", "blockStats", "flashcards", "score"],
      (result) => {
        setBlockedSites(result.blockedSites || []);
        setStats(
          result.blockStats || {
            totalBlocked: 0,
            todayBlocked: 0,
            lastBlocked: null,
          }
        );
        setFlashcards(result.flashcards || []);
        setScore(result.score || 0);
      }
    );
  };

  const normalizeUrl = (url) => {
    // Remove protocol and www, convert to lowercase
    return url
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .toLowerCase()
      .split("/")[0];
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const addSite = () => {
    if (!newSite.trim()) return;

    const siteToAdd = newSite.trim().toLowerCase();

    // Basic URL validation
    if (!siteToAdd.includes(".") && !siteToAdd.startsWith("http")) {
      alert(
        "Please enter a valid website (e.g., facebook.com or https://facebook.com)"
      );
      return;
    }

    // Normalize the URL for comparison
    const normalizedUrl = normalizeUrl(siteToAdd);

    // Check if site already exists (compare normalized URLs)
    if (blockedSites.some((site) => normalizeUrl(site.url) === normalizedUrl)) {
      triggerShake();
      return;
    }

    const newBlockedSite = {
      id: Date.now(),
      url: siteToAdd,
      name: extractDomainName(siteToAdd),
      addedDate: new Date().toISOString(),
      blockedCount: 0,
    };

    const updatedSites = [...blockedSites, newBlockedSite];
    setBlockedSites(updatedSites);
    setNewSite("");

    // Save to storage
    chrome.storage.sync.set({ blockedSites: updatedSites }, () => {
      console.log("Site added to blocked list");
    });
  };

  const removeSite = (id) => {
    const updatedSites = blockedSites.filter((site) => site.id !== id);
    setBlockedSites(updatedSites);

    chrome.storage.sync.set({ blockedSites: updatedSites }, () => {
      console.log("Site removed from blocked list");
    });
  };

  const extractDomainName = (url) => {
    try {
      const domain = url
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split("/")[0];
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch {
      return url;
    }
  };

  const clearAllSites = () => {
    if (window.confirm("Are you sure you want to clear all blocked sites?")) {
      setBlockedSites([]);
      chrome.storage.sync.set({ blockedSites: [] }, () => {
        console.log("All sites cleared");
      });
    }
  };

  const toggleSitesDropdown = () => {
    setIsSitesDropdownOpen(!isSitesDropdownOpen);
  };

  const toggleSiteSelection = (siteId) => {
    setSelectedSites(prev => {
      if (prev.includes(siteId)) {
        return prev.filter(id => id !== siteId);
      } else {
        return [...prev, siteId];
      }
    });
  };

  const removeSelectedSites = () => {
    if (selectedSites.length === 0) return;
    
    const updatedSites = blockedSites.filter(site => !selectedSites.includes(site.id));
    setBlockedSites(updatedSites);
    setSelectedSites([]);
    
    chrome.storage.sync.set({ blockedSites: updatedSites }, () => {
      console.log(`${selectedSites.length} sites removed`);
    });
  };

  const exportSites = () => {
    const dataStr = JSON.stringify(blockedSites, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "koala-blocked-sites.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSites = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSites = JSON.parse(e.target.result);
        if (Array.isArray(importedSites)) {
          setBlockedSites(importedSites);
          chrome.storage.sync.set({ blockedSites: importedSites }, () => {
            console.log("Sites imported successfully");
          });
        }
      } catch (error) {
        alert("Error importing sites. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText) => {
    const lines = csvText.split("\n").filter((line) => line.trim());
    const flashcards = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle CSV parsing with proper quote handling
      const columns = [];
      let current = "";
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          columns.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      columns.push(current.trim());

      // Remove quotes from the beginning and end of each column
      const cleanColumns = columns.map((col) =>
        col.replace(/^"(.*)"$/, "$1").trim()
      );

      if (cleanColumns.length >= 2) {
        const front = cleanColumns[0];
        const back = cleanColumns[1];
        const category = cleanColumns[2] || "Imported";

        if (front && back) {
          flashcards.push({
            id: Date.now() + i, // Ensure unique IDs
            front: front,
            back: back,
            category: category,
          });
        }
      }
    }

    return flashcards;
  };

  const importFlashcardsCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Please select a CSV file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        const importedFlashcards = parseCSV(csvText);

        if (importedFlashcards.length === 0) {
          alert(
            "No valid flashcards found in the CSV file. Please check the format."
          );
          return;
        }

        // Merge with existing flashcards
        const updatedFlashcards = [...flashcards, ...importedFlashcards];
        setFlashcards(updatedFlashcards);

        chrome.storage.sync.set({ flashcards: updatedFlashcards }, () => {
          console.log(
            `Successfully imported ${importedFlashcards.length} flashcards from CSV`
          );
          alert(
            `Successfully imported ${importedFlashcards.length} flashcards from CSV!`
          );
        });

        // Reset file input
        event.target.value = "";
      } catch (error) {
        console.error("Error importing flashcards:", error);
        alert("Error importing flashcards. Please check the CSV format.");
      }
    };

    reader.readAsText(file);
  };

  const addFlashcard = () => {
    if (!newFlashcard.front.trim() || !newFlashcard.back.trim()) {
      alert("Please fill in both front and back of the flashcard");
      return;
    }

    const flashcardToAdd = {
      id: Date.now(),
      front: newFlashcard.front.trim(),
      back: newFlashcard.back.trim(),
      category: newFlashcard.category.trim() || "General",
    };

    const updatedFlashcards = [...flashcards, flashcardToAdd];
    setFlashcards(updatedFlashcards);
    setNewFlashcard({ front: "", back: "", category: "" });

    chrome.storage.sync.set({ flashcards: updatedFlashcards }, () => {
      console.log("Flashcard added successfully");
    });
  };

  const removeFlashcard = (id) => {
    const updatedFlashcards = flashcards.filter((card) => card.id !== id);
    setFlashcards(updatedFlashcards);

    chrome.storage.sync.set({ flashcards: updatedFlashcards }, () => {
      console.log("Flashcard removed successfully");
    });
  };

  const resetScore = () => {
    setScore(0);
    chrome.storage.sync.set({ score: 0 }, () => {
      console.log("Score reset successfully");
    });
  };

  const generateAIFlashcards = async () => {
    if (!aiPrompt.trim()) {
      alert("Please enter a topic or description for the flashcards");
      return;
    }

    if (!GEMINI_API_KEY) {
      alert("Please set your GEMINI_API_KEY environment variable");
      return;
    }

    setIsGenerating(true);

    try {
      // Initialize Google GenAI
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      const prompt = `Generate a set of educational flashcards based on the following topic or description: "${aiPrompt}"

Please create 5-8 flashcards that would be useful for studying this topic. Each flashcard should have:
- A clear, concise question on the front
- A detailed, accurate answer on the back
- The category should be: "${aiCategory || "AI Generated"}"

Format your response as a JSON array where each flashcard is an object with "front", "back", and "category" properties.

Example format:
[
  {
    "front": "What is photosynthesis?",
    "back": "Photosynthesis is the process by which plants convert light energy into chemical energy, using carbon dioxide and water to produce glucose and oxygen.",
    "category": "Biology"
  },
  {
    "front": "What are the main stages of photosynthesis?",
    "back": "The main stages are: 1) Light-dependent reactions (in thylakoids), 2) Light-independent reactions/Calvin cycle (in stroma).",
    "category": "Biology"
  }
]

Make sure the flashcards are educational, accurate, and cover different aspects of the topic.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const generatedText = response.text;

      // Try to extract JSON from the response
      let generatedFlashcards = [];
      try {
        // Look for JSON array in the response
        const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          generatedFlashcards = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON array found in response");
        }
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        // Fallback: try to parse line by line
        const lines = generatedText.split("\n").filter((line) => line.trim());
        generatedFlashcards = lines
          .map((line, index) => {
            // Simple fallback parsing
            const parts = line.split(" - ");
            if (parts.length >= 2) {
              return {
                front: parts[0].replace(/^\d+\.\s*/, "").trim(),
                back: parts[1].trim(),
                category: aiCategory || "AI Generated",
              };
            }
            return null;
          })
          .filter((card) => card !== null);
      }

      if (generatedFlashcards.length === 0) {
        alert(
          "No flashcards could be generated. Please try a different prompt."
        );
        return;
      }

      // Add unique IDs and merge with existing flashcards
      const flashcardsWithIds = generatedFlashcards.map((card, index) => ({
        id: Date.now() + index,
        front: card.front,
        back: card.back,
        category: card.category || aiCategory || "AI Generated",
      }));

      const updatedFlashcards = [...flashcards, ...flashcardsWithIds];
      setFlashcards(updatedFlashcards);

      chrome.storage.sync.set({ flashcards: updatedFlashcards }, () => {
        console.log(
          `Successfully generated ${flashcardsWithIds.length} AI flashcards`
        );
        alert(`Successfully generated ${flashcardsWithIds.length} flashcards!`);
      });

      // Clear the prompt
      setAiPrompt("");
      setAiCategory("");
    } catch (error) {
      console.error("Error generating flashcards:", error);
      alert(
        "Error generating flashcards. Please check your API key and try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🦥 Koala Extension Dashboard</h1>
          <p>Manage your blocked websites and flashcards</p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{blockedSites.length}</span>
            <span className="stat-label">Sites Blocked</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.totalBlocked}</span>
            <span className="stat-label">Total Blocks</span>
          </div>
          <div className="stat-item">
            <span
              className={`stat-number ${
                score >= 0 ? "positive-score" : "negative-score"
              }`}
            >
              {score}
            </span>
            <span className="stat-label">Koala Kudos</span>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="blocked-sites-section">
          <div className="section-header">
            <h2>Blocked Websites ({blockedSites.length})</h2>
            <div className="section-actions">
              <button onClick={exportSites} className="action-btn secondary">
                Export
              </button>
              <label className="action-btn secondary">
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={importSites}
                  style={{ display: "none" }}
                />
              </label>
              <button onClick={clearAllSites} className="action-btn danger">
                Clear All
              </button>
            </div>
          </div>

          <div className="add-site-form">
            <input
              type="text"
              value={newSite}
              onChange={(e) => setNewSite(e.target.value)}
              placeholder="Enter website to block (e.g., facebook.com, twitter.com)"
              className={`site-input ${isShaking ? "shake" : ""}`}
              onKeyPress={(e) => e.key === "Enter" && addSite()}
            />
            <button onClick={addSite} className="add-btn">
              Add Site
            </button>
          </div>

          {blockedSites.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🚫</div>
              <h3>No sites blocked yet</h3>
              <p>Add websites above to start blocking them</p>
            </div>
          ) : blockedSites.length <= 5 ? (
            <div className="sites-grid">
              {blockedSites.map((site) => (
                <div key={site.id} className="site-card">
                  <div className="site-info">
                    <div className="site-name">{site.name}</div>
                    <div className="site-url">{site.url}</div>
                    <div className="site-meta">
                      Added: {new Date(site.addedDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="site-actions">
                    <button
                      onClick={() => removeSite(site.id)}
                      className="remove-btn"
                      title="Remove site"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sites-dropdown-container">
              <div className="sites-dropdown-header">
                <div className="dropdown-summary">
                  <span className="summary-text">
                    Showing {blockedSites.length} blocked websites
                  </span>
                  {selectedSites.length > 0 && (
                    <span className="selected-count">
                      ({selectedSites.length} selected)
                    </span>
                  )}
                </div>
                <div className="dropdown-controls">
                  {selectedSites.length > 0 && (
                    <button
                      onClick={removeSelectedSites}
                      className="action-btn danger"
                    >
                      Remove Selected ({selectedSites.length})
                    </button>
                  )}
                  <button
                    onClick={toggleSitesDropdown}
                    className="dropdown-toggle-btn"
                  >
                    {isSitesDropdownOpen ? "Hide Sites" : "Show Sites"}
                    <span className={`dropdown-arrow ${isSitesDropdownOpen ? "open" : ""}`}>
                      ▼
                    </span>
                  </button>
                </div>
              </div>
              
              {isSitesDropdownOpen && (
                <div className="sites-dropdown-content">
                  <div className="sites-dropdown-list">
                    {blockedSites.map((site) => (
                      <div key={site.id} className="site-dropdown-item">
                        <label className="site-checkbox-label">
                          <input
                            type="checkbox"
                            checked={selectedSites.includes(site.id)}
                            onChange={() => toggleSiteSelection(site.id)}
                            className="site-checkbox"
                          />
                          <div className="site-item-info">
                            <div className="site-item-name">{site.name}</div>
                            <div className="site-item-url">{site.url}</div>
                            <div className="site-item-meta">
                              Added: {new Date(site.addedDate).toLocaleDateString()}
                            </div>
                          </div>
                        </label>
                        <button
                          onClick={() => removeSite(site.id)}
                          className="site-item-remove-btn"
                          title="Remove site"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flashcards-section">
          <div className="section-header">
            <h2>📚 Flashcards ({flashcards.length})</h2>
            <div className="section-actions">
              <div className="csv-import-container">
                <label className="action-btn secondary">
                  📥 Import CSV
                  <input
                    type="file"
                    accept=".csv"
                    onChange={importFlashcardsCSV}
                    style={{ display: "none" }}
                  />
                </label>
                <div className="tooltip">
                  <span className="tooltip-icon">?</span>
                  <div className="tooltip-content">
                    <div className="tooltip-header">CSV Format</div>
                    <div className="tooltip-body">
                      <p>
                        <strong>Format:</strong>{" "}
                        <code>front,back,category</code>
                      </p>
                      <p>
                        <strong>Example:</strong>
                      </p>
                      <code>
                        "What is the capital of France?","Paris","Geography"
                      </code>
                      <p>
                        Supports Quizlet exports and other CSV formats with
                        question/answer pairs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={resetScore} className="action-btn danger">
                🔄 Reset Score
              </button>
            </div>
          </div>

          <div className="add-flashcard-section">
            <h3>Add New Flashcard</h3>

            {/* AI Generation Section */}
            <div className="ai-generation-section">
              <div
                className="ai-section-header"
                onClick={() => setIsAiSectionOpen(!isAiSectionOpen)}
              >
                <h4>🤖 AI Flashcard Generator</h4>
                <span
                  className={`dropdown-arrow ${isAiSectionOpen ? "open" : ""}`}
                >
                  ▼
                </span>
              </div>

              {isAiSectionOpen && (
                <div className="ai-section-content">
                  <p className="ai-info">
                    Describe any topic and let AI generate educational
                    flashcards for you!
                  </p>
                  <div className="ai-form">
                    <div className="form-group">
                      <label>Topic or Description:</label>
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="e.g., 'Photosynthesis in plants', 'World War 2 history', 'JavaScript fundamentals', 'Spanish vocabulary for beginners'"
                        className="form-textarea"
                        rows="3"
                      />
                    </div>
                    <div className="form-group">
                      <label>Category (Optional):</label>
                      <input
                        type="text"
                        value={aiCategory}
                        onChange={(e) => setAiCategory(e.target.value)}
                        placeholder="e.g., Biology, History, Programming"
                        className="form-input"
                      />
                    </div>
                    <button
                      onClick={generateAIFlashcards}
                      className="ai-generate-btn"
                      disabled={isGenerating || !aiPrompt.trim()}
                    >
                      {isGenerating
                        ? "🤖 Generating Flashcards..."
                        : "🤖 Generate Flashcards"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flashcard-form">
              <div className="form-group">
                <label>Front (Question):</label>
                <input
                  type="text"
                  value={newFlashcard.front}
                  onChange={(e) =>
                    setNewFlashcard({ ...newFlashcard, front: e.target.value })
                  }
                  placeholder="Enter the question or front text"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Back (Answer):</label>
                <input
                  type="text"
                  value={newFlashcard.back}
                  onChange={(e) =>
                    setNewFlashcard({ ...newFlashcard, back: e.target.value })
                  }
                  placeholder="Enter the answer or back text"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Category (Optional):</label>
                <input
                  type="text"
                  value={newFlashcard.category}
                  onChange={(e) =>
                    setNewFlashcard({
                      ...newFlashcard,
                      category: e.target.value,
                    })
                  }
                  placeholder="e.g., Math, Science, Language"
                  className="form-input"
                />
              </div>
              <button onClick={addFlashcard} className="add-flashcard-btn">
                Add Flashcard
              </button>
            </div>
          </div>

          {flashcards.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>No flashcards yet</h3>
              <p>Add flashcards above to see them when sites are blocked</p>
            </div>
          ) : (
            <div className="flashcards-grid">
              {flashcards.map((card) => (
                <div key={card.id} className="flashcard-preview">
                  <div className="flashcard-preview-content">
                    <div className="flashcard-preview-front">
                      <strong>Front:</strong> {card.front}
                    </div>
                    <div className="flashcard-preview-back">
                      <strong>Back:</strong> {card.back}
                    </div>
                    <div className="flashcard-preview-category">
                      Category: {card.category}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFlashcard(card.id)}
                    className="remove-flashcard-btn"
                    title="Remove flashcard"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="info-section">
          <h2>How It Works</h2>
          <div className="info-cards">
            <div className="info-card">
              <div className="info-icon">🎯</div>
              <h3>Target Blocking</h3>
              <p>
                When you visit any of the blocked websites, you'll see a custom
                React page instead.
              </p>
            </div>
            <div className="info-card">
              <div className="info-icon">📚</div>
              <h3>Flashcard Learning</h3>
              <p>
                Study with flashcards while sites are blocked. Add your own
                cards above!
              </p>
            </div>
            <div className="info-card">
              <div className="info-icon">🔧</div>
              <h3>Easy Management</h3>
              <p>
                Add, remove, and manage your blocked sites and flashcards from
                this dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
