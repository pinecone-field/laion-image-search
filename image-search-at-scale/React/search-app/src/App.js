import React, {useState, useEffect} from 'react'
import './App.css'
import api from './api'
import ImageFetch from './ImageFetch';
import PineconeLogo from './assets/pinecone-logo-black.png'
import OriginalImage from './assets/image.jpeg'


function App() {
  const [searchMode, setSearchMode] = useState('text'); // State to toggle between text and image search

  const handleModeChange = (e) => {
    setSearchMode(e.target.value);
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
              <input type="text" placeholder="Search..." className="search-input" />
              <button className="search-button">Search</button>
            </div>
          ) : (
            <div className="drag-drop-box">
              <p>Drag and drop an image here</p>
              {/* Implement drag and drop functionality here */}
            </div>
          )}
          <div className="original-photo">
            <h2 className="original-photo-title">Original Photo</h2>
            <img src={OriginalImage} alt="Original Photo" className="original-photo-image" />
          </div>
        </div>
      </header>
      <ImageFetch />
    </div>
  );
}




export default App;
