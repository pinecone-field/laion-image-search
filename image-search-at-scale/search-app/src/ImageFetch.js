import React, { useState, useEffect } from 'react';
import './ImageFetch.css';
import configData from './config.json';

const ImageFetch = ({ uploadedImages }) => {
  const [images, setImages] = useState([]);
  const [error, setError] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [fetching, setFetching] = useState(false);
  const SERVER_URL = configData.SERVER_URL;

  const fetchImages = async () => {
    setFetching(true);
    try {
      const response = await fetch(SERVER_URL);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setImages(data);
      } else {
        throw new Error('Fetched data is not an array');
      }
    } catch (error) {
      setError(error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    if (uploadedImages.length > 0) {
      fetchImages();
    }
  }, [uploadedImages]);

  const handleMouseEnter = (index) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="image-grid-container">
      <h1>Search Results</h1>
      {fetching ? (
        <p>Loading...</p>
      ) : (
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
      )}
    </div>
  );
};

export default ImageFetch;