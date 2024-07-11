// src/components/SearchComponent.js
import React, { useContext, useState } from 'react';
import { ImageContext } from './ImageContext';

const SearchComponent = () => {
  const [searchText, setSearchText] = useState('');
  const { setImages } = useContext(ImageContext);
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);
  const [fetching, setFetching] = useState(false); // State to track fetching status

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleSearchSubmit = async () => {
    setFetching(true);
    fetch('http://localhost:8000/images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ searchText }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log('Fetched data:', data);
      if (Array.isArray(data)) {
        setImages(data)
      } else {
        throw new Error('Fetched data is not an array');
      }
    })
    .catch(error => setError(error))
    .finally(() => setFetching(false))
  };

  return (
    <div className='search-bar'>
      <input
        type="text"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <button onClick={handleSearchSubmit} disabled={fetching}>
        {fetching ? 'Searching...' : 'Search Images'}
      </button>
    </div>
  );
};

export default SearchComponent;
