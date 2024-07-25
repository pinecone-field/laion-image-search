import React, { useContext, useState } from 'react';
import { ImageContext } from './ImageContext';

const SearchComponent = () => {
  const [searchText, setSearchText] = useState('');
  const { setImages } = useContext(ImageContext);
  const [searchResults, setSearchResults] = useState([]);

  const handleSearchSubmit = async () => {
    try {
      const response = await fetch('http://localhost:8000/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchText }),
      });
      if (response.ok) {
        const results = await response.json();
        setImages(results);
      } else {
        alert('Failed to fetch search results.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred.');
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
      <button className="search-button" onClick={handleSearchSubmit}>Search</button>
    </div>
  );
};

export default SearchComponent;
