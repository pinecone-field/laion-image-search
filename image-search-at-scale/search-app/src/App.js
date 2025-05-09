import React, {useState, useEffect} from 'react'
import './App.css'
import ImageFetch from './components/ImageFetch';
import PineconeLogo from './assets/pinecone-logo-black.png'
import Dropzone from './components/Dropzone';
import IndexSize from './components/IndexSize';
import Search from './components/Search';
import ImageDisplay from './components/ImageDisplay';
import { ImageProvider } from './components/ImageContext';

function App() {
  const [files, setFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageStored, setImageStored] = useState(false);

  const handleUploadSuccess = (images) => {
    setUploadedImages(images);
  };

  const handleImageStored = () => {
    setImageStored(true);
  };

  useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview))
    };
  }, [files]);

  useEffect(() => {
    const checkLocalStorage = () => {
      const localImage = localStorage.getItem("uploaded_image");
      if (localImage) {
        setImageStored(true);
      }
    };

    checkLocalStorage();
  }, []);

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
          <div className="index-size">
            <IndexSize />
            </div>
        </div>
      </header>
        <div className="search-container">
            <Search />
            <Dropzone onImageStored={handleImageStored} onUploadSuccess={handleUploadSuccess} />
        </div>
      {imageStored && <ImageFetch uploadedImages={uploadedImages}/>}
      <ImageDisplay/>
    </div>
    </ImageProvider>
  );
}

export default App;
