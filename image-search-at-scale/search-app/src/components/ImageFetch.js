import React, { useState, useEffect, useContext } from 'react';
import { ImageContext } from './ImageContext';
import configData from './config.json'

const ImageFetch = () => {
  const { setImages } = useContext(ImageContext);
  const [error, setError] = useState(null);
  const [fetching, setFetching] = useState(false);
  const SERVER_URL = configData.SERVER_URL

  const fetchImages = () => {
    setFetching(true);
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
      .finally(() => setFetching(false));
  };

  useEffect(() => {
    fetchImages();
  }, []);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

};

export default ImageFetch;