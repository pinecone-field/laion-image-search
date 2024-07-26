import React, { useState, useEffect, useContext } from 'react';
import { ImageContext } from './ImageContext';
import configData from './config.json';

const SERVER_URL = `${configData.SERVER_URL}/images`;

export const fetchImages = async (setImages, setError, setFetching) => {
  setFetching(true);
  try {
    const response = await fetch(SERVER_URL);
    if (!response.ok) {
      throw new Error('Network response was not ok.\n', response);
    }
    const data = await response.json();
    console.log('Fetched data:', data);
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

const ImageFetch = ({ uploadedImages }) => {
  const { setImages } = useContext(ImageContext);
  const [error, setError] = useState(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetchImages(setImages, setError, setFetching);
  }, [uploadedImages]);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return null;
};

export default ImageFetch;