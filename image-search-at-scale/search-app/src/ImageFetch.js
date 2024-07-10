import React, { useState, useEffect } from 'react';
import './ImageFetch.css';
import configData from './config.json'

const ImageFetch = () => {
  const [images, setImages] = useState([]);
  const [error, setError] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [fetching, setFetching] = useState(false); // State to track fetching status
  const SERVER_URL = configData.SERVER_URL

  const fetchImages = () => {
    setFetching(true); // Set fetching to true to show loading indicator if needed
    fetch(SERVER_URL)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Fetched data:', data); 
        if (Array.isArray(data)) {
          setImages(data);
        } else {
          throw new Error('Fetched data is not an array');
        }
      })
      .catch(error => setError(error))
      .finally(() => setFetching(false)); // Set fetching to false after fetching completes
  };

  useEffect(() => {
    fetchImages(); // Fetch images on component mount
  }, []); 

  const handleMouseEnter = (index) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const handleButtonClick = () => {
    fetchImages(); // Call fetchImages when button is clicked
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
      <div className="image-grid-container">
        <h1>Search Results</h1>
        <button onClick={handleButtonClick} disabled={fetching}>Fetch Images</button>
        <div className="image-grid">
          {images.map((image, index) => (
            <div
              key={index}
              className="image-item"
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="similarity-score">
                Similarity Score: {image.score}
              </div>
              <img
                src={image.url}
                alt={`Image ${index}`}
                className="image"
              />
              <div className="image-footer">
                <p className="image-title" style={{ opacity: hoveredIndex === index ? 1 : 0 }}>
                  {image.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
};

export default ImageFetch;