import React, {useState, useEffect} from 'react'
import './App.css'
import ImageFetch from './components/ImageFetch';
import PineconeLogo from './assets/pinecone-logo-black.png'
import Dropzone from './components/Dropzone';
import configData from './config.json'
import Search from './components/Search';
import ImageDisplay from './components/ImageDisplay';
import { ImageProvider } from './components/ImageContext';

function App() {
  const [files, setFiles] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const SERVER_URL = configData.SERVER_URL

  useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview))
    };
  }, [files]);

  return (
    <ImageProvider>
    <div className="App">
      <header className="App-header">
        <div className="header-content">
         <a href="https://app.pinecone.io/organizations/-NF9xx-MFLRfp0AAuCon/projects/00e0f161-f169-4ba8-84d2-bbab9b875c27/indexes/laion-400m/browser"
           target="_blank">
             <img src={PineconeLogo} alt="Pinecone Logo" className="pinecone-logo" />
         </a>
          <h1 className="header-title">Image Search Demo</h1>
        </div>
      </header>
        <div className="search-container">
            <div className="search-bar">
            {/*Text search to be added here */} 
            </div>
          <div className="original-photo">
            <h2 className="original-photo-title">Original Photo</h2>
            <img src={OriginalImage} alt="Original Photo" className="original-photo-image" />
          </div>
        </div>
      <ImageFetch/>
      <ImageDisplay/>
    </div>
    </ImageProvider>
  );
}

export default App;
