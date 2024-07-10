import React, {useState, useEffect} from 'react'
import './App.css'
import ImageFetch from './components/ImageFetch';
import PineconeLogo from './assets/pinecone-logo-black.png'
import OriginalImage from './assets/image.jpeg'
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
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleSearchSubmit = async () => {
    try {
      const response = await fetch( SERVER_URL, {
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
    <ImageProvider>
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <img src={PineconeLogo} alt="Pinecone Logo" className="pinecone-logo" />
          <h1 className="header-title">Image Search Demo</h1>
        </div>
      </header>
        <div className="search-container">
            <div className="search-bar">
      
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
