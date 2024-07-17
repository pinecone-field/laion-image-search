import React, {useState, useEffect} from 'react'
import './App.css'
import ImageFetch from './ImageFetch';
import PineconeLogo from './assets/pinecone-logo-black.png'
import OriginalImage from './assets/image.jpeg'
import Dropzone from './components/Dropzone';


function App() {
  const [uploadedImages, setUploadedImages] = useState([]);

  const handleUploadSuccess = (images) => {
    setUploadedImages(images);
  };

  return (
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
          <div className="original-photo">
            <h2 className="original-photo-title">Original Photo</h2>
            <img src={OriginalImage} alt="Original Photo" className="original-photo-image" />
          </div>
          <Dropzone onUploadSuccess={handleUploadSuccess} />
        </div>
      <ImageFetch uploadedImages={uploadedImages}/>
    </div>
  );
}




export default App;
