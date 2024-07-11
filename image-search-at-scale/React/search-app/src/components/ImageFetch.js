import React, { useState, useContext } from 'react';
import { ImageContext } from './ImageContext';

const ImageFetch = ({ onImagesFetched }) => {
  const { setImages } = useContext(ImageContext);
  const [error, setError] = useState(null);
  const [fetching, setFetching] = useState(false);

  const fetchImages = () => {
    setFetching(true);
    fetch('http://localhost:8000/images')
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
          onImagesFetched(data); // Update local state in App.js
        } else {
          throw new Error('Fetched data is not an array');
        }
      })
      .catch(error => setError(error))
      .finally(() => setFetching(false));
  };

  const handleButtonClick = () => {
    fetchImages();
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <button onClick={handleButtonClick} disabled={fetching}>
        {fetching ? 'Fetching...' : 'Fetch Images'}
      </button>
    </div>
  );
};

export default ImageFetch;