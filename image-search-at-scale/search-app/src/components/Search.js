import React, { useContext, useState, useEffect } from 'react';
import { ImageContext } from './ImageContext';
import configData from './config.json';
import './Search.css';

const SearchComponent = () => {
  const { searchText, setImages, setSearchText, setCurrentImage, fetching, setFetching } = useContext(ImageContext);
  const [errorMessage, setErrorMessage] = useState('');
  const SERVER_URL = configData.SERVER_URL+"/text-search"

  useEffect(() => {
    const handleImageFetchStart = () => {
      setErrorMessage('');
    };
    window.addEventListener('imageFetchStarted', handleImageFetchStart);
    return () => {
      window.removeEventListener('imageFetchStarted', handleImageFetchStart);
    };
  }, []);

  const handleSearchSubmit = async () => {
    if (searchText.trim().length === 0) {
      setErrorMessage("Cannot search with empty text");
    } else {
      setErrorMessage('');
      setFetching(true);
      try {
        const response = await fetch(SERVER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ searchText }),
        });
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem("uploaded_image", data.image_base64);
          setCurrentImage(data.image_base64);
          setImages(data.search_results);
        } else {
          setErrorMessage('Failed to fetch search results.');
        }
      } catch (error) {
        console.error('Error:', error);
        setErrorMessage('An error occurred.');
      } finally {
        setFetching(false);
      }
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  return (
    <div className="search-bar">
      <input className="search-input"
        type="text"
        placeholder='Search with text...'
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <button className="search-button" onClick={handleSearchSubmit} disabled={fetching}>
        {fetching ? 'Searching...' : 'Search'}
      </button>
      {errorMessage && <div className="error-message">{errorMessage}</div>}
    </div>
  );
};

export default SearchComponent;