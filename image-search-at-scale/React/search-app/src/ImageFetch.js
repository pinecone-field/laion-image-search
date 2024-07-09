import React, { useState, useEffect } from 'react';
import './ImageFetch.css'; // Import the CSS file

const ImageFetch = () => {
  const [images, setImages] = useState([]);
  const [error, setError] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
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
      .catch(error => setError(error));
  }, []); // Empty dependency array means this effect runs once when the component mounts

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
                src={image.url} // Adjust based on your data structure
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
