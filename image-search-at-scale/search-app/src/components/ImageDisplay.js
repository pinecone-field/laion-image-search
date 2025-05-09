import React, { useContext, useState } from 'react';
import './ImageDisplay.css';
import { ImageContext } from './ImageContext';
import { fetchImages } from './ImageFetch';
import configData from './config.json'


const ImageDisplay = () => {
  const { images, setImages, setSearchText, setCurrentImage } = useContext(ImageContext);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [fetching, setFetching] = useState(false);
  const SERVER_URL = configData.SERVER_URL+"/download-image";
  const [setError] = useState(null);

  const handleMouseEnter = (index) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const handleMouseClick = async (url) => {
    try {
      const response = await fetch(SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image_path: "", image_base64: "", image_url: url })
      });
      if (!response.ok) {
        throw new Error("Network response was: ", response.error);
      } else {
        const data = await response.json();
        localStorage.setItem("uploaded_image", data);
        setCurrentImage(data);
        console.log("Fetching...");
        fetchImages(setImages, setError, setFetching);
        setSearchText('')
      }
  
      const data = await response.json();
      console.log('Response from backend:', data);
    } catch (error) {
      console.error('There was a problem with the fetch operation: ', error);
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
                alt={{index}}
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