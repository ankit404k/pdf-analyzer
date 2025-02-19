import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null); // Clear previous errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to analyze.');
      return;
    }

    setLoading(true);
    setError(null); // Clear previous errors
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1];
      try {
        const response = await axios.post('http://localhost:5000/api/analyze', {
          file: base64
        });
        setAnalysis(response.data);
      } catch (error) {
        console.error(error);
        setError('Failed to analyze document. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="App">
      <h1>Competitor Document Analyzer</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
        <button type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Document'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {analysis && (
        <div className="results">
          <h2>Analysis Results</h2>
          <div className="summary">
            <h3>Summary</h3>
            <p>{analysis.summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
