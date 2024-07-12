import React, { useState, useContext } from 'react';
import { ImageContext } from './ImageContext';

const SearchComponent = ({ onSearchResults }) => {
  const [searchText, setSearchText] = useState('');
  const { setImages } = useContext(ImageContext);
  const [error, setError] = useState(null);
  const [fetching, setFetching] = useState(false);

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
        setImages(data); // Store fetched images globally
        onSearchResults(data); // Update local state in App.js
      } else {
        throw new Error('Fetched data is not an array');
      }
    })
    .catch(error => setError(error))
    .finally(() => setFetching(false));
  };

  return (
    <div className='search-bar'>
      <input
        type="text"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onKeyPress={(event) => {
          if (event.key === 'Enter') {
            handleSearchSubmit();
          }
        }}
      />
      <button onClick={handleSearchSubmit} disabled={fetching}>
        {fetching ? 'Searching...' : 'Search Images'}
      </button>
    </div>
  );
};

export default SearchComponent;