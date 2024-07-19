import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ImageFetch.css';
import configData from './config.json'

const ImageFetch = () => {
  const [images, setImages] = useState([]);
  const [error, setError] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const SERVER_URL = configData.SERVER_URL

  const fetchImages = () => {
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
      .catch(error => setError(error));
  }

  useEffect(() => {
    fetchImages();
  }, []); 

  const handleMouseEnter = (index) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const handleMouseClick = async (url) => {
    try {
      const response = await fetch('http://localhost:8000/download-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 'image_url': url })
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      } else {
        fetchImages()
      }

      const data = await response.json();
      console.log('Response from backend:', data);
    } catch (error) {
      console.error('There was a problem with the fetch operation')
    }
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
      <div className="image-grid-container">
        <h1>Search Results</h1>
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
                onClick={() => handleMouseClick(image.url)}
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
