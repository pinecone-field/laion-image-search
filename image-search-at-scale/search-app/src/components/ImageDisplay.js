// src/components/ImageDisplay.js
import React, { useContext, useState } from 'react';
import './ImageDisplay.css';
import { ImageContext } from './ImageContext';

const ImageDisplay = () => {
  const { images } = useContext(ImageContext);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const handleMouseEnter = (index) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

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
            <img
              src={image.url}
              alt={`Image ${index}`}
              className="image"
            />
            <div className="similarity-score">
              Similarity Score: {image.score}
            </div>
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

export default ImageDisplay;
