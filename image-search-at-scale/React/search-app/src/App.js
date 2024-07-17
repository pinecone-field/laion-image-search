import React, {useState, useEffect} from 'react'
import './App.css'
import ImageFetch from './ImageFetch';
import PineconeLogo from './assets/pinecone-logo-black.png'
import OriginalImage from './assets/image.jpeg'


function App() {

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <img src={PineconeLogo} alt="Pinecone Logo" className="pinecone-logo" />
          <h1 className="header-title">Image Search Demo</h1>
        </div>
      </header>
        <div className="search-container">
            <div className="search-bar">
              <input type="text" placeholder="Search..." className="search-input" />
              <button className="search-button">Search</button>
            </div>
          <div className="original-photo">
            <h2 className="original-photo-title">Original Photo</h2>
            <img src={OriginalImage} alt="Original Photo" className="original-photo-image" />
          </div>
        </div>
      <ImageFetch />
    </div>
  );
}




export default App;
