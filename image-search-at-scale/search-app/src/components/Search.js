import React, { useContext, useState } from 'react';
import { ImageContext } from './ImageContext';
import configData from './config.json'
import './Search.css'

const SearchComponent = () => {
  const [searchText, setSearchText] = useState('');
  const { setImages } = useContext(ImageContext);
  const [searchResults, setSearchResults] = useState([]);
  const [fetching, setFetching] = useState(false)
  const SERVER_URL = configData.SERVER_URL+"/text-search"

  const handleSearchSubmit = async () => {
    setFetching(true)
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
        setImages(data.search_results);
      } else {
        alert('Failed to fetch search results.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred.');
    } finally {
      (setFetching(false))
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
      <button className="search-button" onClick={handleSearchSubmit} disabled={fetching} >
              {fetching ? 'Searching...' : 'Search'}
      </button>
    </div>
  );
};

export default SearchComponent;
