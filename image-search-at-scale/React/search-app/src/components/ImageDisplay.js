// src/components/ImageDisplay.js
import React, { useContext, useState } from 'react';
import './ImageDisplay.css'; // Import the CSS file
import { ImageContext } from './ImageContext';

const ImageDisplay = ( {searchMode, textImages, imageFiles} ) => {
  const { images } = useContext(ImageContext);
  const [hoveredIndex, setHoveredIndex] = useState([])

  const getImagesToDisplay = () => {
    if (searchMode === 'text') {
      return textImages;
    } else {
      return imageFiles;
    }
  };

  const imagesToShow = getImagesToDisplay();

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
        {imagesToShow.map((image, index) => (
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

export default ImageDisplay;
