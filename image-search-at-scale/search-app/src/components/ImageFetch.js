import React, { useState, useEffect, useContext } from 'react';
import { ImageContext } from './ImageContext';
import configData from './config.json';

const SERVER_URL = `${configData.SERVER_URL}/image-search`;

export const fetchImages = async (setImages, setError, setFetching) => {
  setFetching(true);
  try {
    const base64Image = localStorage.getItem("uploaded_image");
    if(!base64Image) {
      throw new Error('No image in local storage (ImageFetch)');
    }

    const response = await fetch(SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ image_path: "", image_base64: base64Image, image_url: "" }),
    });
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