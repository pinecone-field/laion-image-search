import React, { useState, useEffect, useContext } from 'react';
import { ImageContext } from './ImageContext';

const ImageFetch = () => {
  const { setImages } = useContext(ImageContext);
  const [error, setError] = useState(null);
  const [fetching, setFetching] = useState(false); // State to track fetching status

  const fetchImages = () => {
    setFetching(true); // Set fetching to true to disable button and show loading indicator
    fetch('http://localhost:8000/images')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Fetched data:', data); // Log fetched data for debugging
        if (Array.isArray(data)) {
          setImages(data);
        } else {
          throw new Error('Fetched data is not an array');
        }
      })
      .catch(error => setError(error))
      .finally(() => setFetching(false)); // Set fetching to false after fetching completes
  };

  const handleButtonClick = () => {
    fetchImages(); // Call fetchImages when button is clicked
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