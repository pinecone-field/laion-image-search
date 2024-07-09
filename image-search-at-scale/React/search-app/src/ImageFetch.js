import React, { useState, useEffect } from 'react';
import './ImageFetch.css';

const ImageFetch = () => {
  const [images, setImages] = useState([]);
  const [error, setError] = useState(null);

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

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="image-grid-container">
      <h1>Image Fetch</h1>
      <div className="image-grid">
        {images.map((image, index) => (
          <div key={index} className="image-item">
            <img
              src={image.url} // Adjust based on your data structure
              alt={`Image ${index}`}
              className="image"
            />
            <div className="image-footer">
              <p className="image-name">{image.caption}</p>
              <p className="similarity-score">Similarity Score: {image.score}</p> {/* Adjust based on your data structure */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageFetch;


