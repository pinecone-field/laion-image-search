import React, {useState, useEffect} from 'react'
import './App.css'
import api from './api'
import ImageFetch from './ImageFetch';
import PineconeLogo from './assets/pinecone-logo-black.png'
import OriginalImage from './assets/image.jpeg'
import Dropzone from './components/Dropzone';

function App() {

  const [searchMode, setSearchMode] = useState('text'); // State to toggle between text and image search
  const [files, setFiles] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleModeChange = (e) => {
    setSearchMode(e.target.value);
  };

  const handleDrop = (acceptedFiles) => {
    setFiles(acceptedFiles.map((file) => Object.assign(file, {
      preview: URL.createObjectURL(file)
    })));
  }

  useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview))
    };
  }, [files]);
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleSearchSubmit = async () => {
    try {
      const response = await fetch('http://localhost:8000/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchText }),
      });
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      } else {
        alert('Failed to fetch search results.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred.');  // add useEffect?????
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <img src={PineconeLogo} alt="Pinecone Logo" className="pinecone-logo" />
          <h1 className="header-title">Image Search Demo</h1>
          <div className="slider-container">
            <label className={`slider-label ${searchMode === 'text' ? 'active' : ''}`}>
              <input
                type="radio"
                value="text"
                checked={searchMode === 'text'}
                onChange={handleModeChange}
                className="slider-input"
              />
              Text
            </label>
            <label className={`slider-label ${searchMode === 'image' ? 'active' : ''}`}>
              <input
                type="radio"
                value="image"
                checked={searchMode === 'image'}
                onChange={handleModeChange}
                className="slider-input"
              />
              Image
            </label>
          </div>
        </div>
        <div className="search-container">
          {searchMode === 'text' ? (
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search..."
                className="search-input"
                value={searchText}
                onChange={handleSearchChange}
              />
              <button className="search-button" onClick={handleSearchSubmit}>
                Search
              </button>
            </div>
          ) : (
              <Dropzone onDrop={handleDrop} />
          )}
          <div className="original-photo">
            <h2 className="original-photo-title">Photo to Search</h2>
            <img src={OriginalImage} alt="Original Photo" className="original-photo-image" />
          </div>
        </div>
      </header>
      <ImageFetch/>
    </div>
  );
}





export default App;
