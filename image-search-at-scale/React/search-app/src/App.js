import React, { useState } from 'react';
import './App.css';
import ImageFetch from './components/ImageFetch';
import PineconeLogo from './assets/pinecone-logo-black.png';
import OriginalImage from './assets/image.jpeg';
import Dropzone from './components/Dropzone';
import Search from './components/Search';
import ImageDisplay from './components/ImageDisplay';
import { ImageProvider } from './components/ImageContext';
import IndexSizeDisplay from './components/IndexSizeDisplay';

function App() {
  const [searchMode, setSearchMode] = useState('text');
  const [textImages, setTextImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);

  const handleModeChange = (e) => {
    setSearchMode(e.target.value);
  };

  const handleDrop = (acceptedFiles) => {
    setImageFiles(acceptedFiles.map((file) => Object.assign(file, {
      preview: URL.createObjectURL(file)
    })));
  };

  return (
    <ImageProvider>
      <div className="App">
        <header className="App-header">
          <div className="header-content">
            <a href="https://www.pinecone.io" target="_blank">
              <img src={PineconeLogo} alt="Pinecone Logo" className="pinecone-logo" />
            </a>

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
         </header>
         <div className='index-size-display'>
          <IndexSizeDisplay />
         </div>
          <div className="search-container">
            {searchMode === 'text' ? (
              <div className="search-bar">
                <Search onSearchResults={setTextImages} />
              </div>
            ) : (
              <div className='image-search-wrapper'>
                <div className='image-search-container'>
                  <Dropzone onDrop={handleDrop} />
                  <div className="original-photo">
                    <h2 className="original-photo-title">Photo to Search</h2>
                    <img src={OriginalImage} alt="Original Photo" className="original-photo-image" />
                  </div>
                </div>
                <div className='fetch-image-button'>
                  <ImageFetch onImagesFetched={setImageFiles} />
                </div>
              </div>
            )}
          </div>
        
        <ImageDisplay
          searchMode={searchMode}
          textImages={textImages}
          imageFiles={imageFiles}
        />
      </div>
    </ImageProvider>
  );
}

export default App;