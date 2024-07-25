import React, { useContext, useState } from 'react';
import './ImageDisplay.css';
import { ImageContext } from './ImageContext';
import { fetchImages } from './ImageFetch';

const ImageDisplay = () => {
  const { setImages } = useContext(ImageContext);
  const { images } = useContext(ImageContext);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);

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
        console.log("Fetching...")
        fetchImages(setImages, setError, setFetching)
      }
  
      const data = await response.json();
      console.log('Response from backend:', data);
    } catch (error) {
      console.error('There was a problem with the fetch operation')
    }
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
      )}
    </div>
  );
}

export default ImageDisplay;