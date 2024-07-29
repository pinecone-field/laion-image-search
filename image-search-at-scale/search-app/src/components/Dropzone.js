import React, { useContext, useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import configData from './config.json'
import OriginalImage from '../assets/image.jpeg';
import { ImageContext } from './ImageContext';
import { fetchImages } from './ImageFetch';
import './Dropzone.css';

const SERVER_URL = `${configData.SERVER_URL}/upload`;
const ENCODE = `${configData.SERVER_URL}/encode`;

const Dropzone = () => {
  const { setImages } = useContext(ImageContext);
  const [fetching, setFetching] = useState();
  const [error, setError] = useState();
  const [currentImage, setCurrentImage] = useState(OriginalImage);

  useEffect(() => {
    const loadImage = async () => {
      let localImage = localStorage.getItem("uploaded_image");
      
      if (localImage == null) {
        console.log("No image found in local storage.");
        try {
          const response = await fetch(ENCODE, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image_path: "./search-app/src/assets/image.jpeg"}),
          });
          if (response.ok) {
            const data = await response.json();
            const b64String = data.encoded_image;
            localStorage.setItem("uploaded_image", b64String);
            localImage = b64String;
          } else {
            alert('Failed to encode image: ', response);
          }
        } catch (error) {
          console.error('Error:', error);
          alert('An error occurred while trying to get local storage');
        }
      }
      
      setCurrentImage(localImage);
    };

    loadImage();
  }, []);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    const reader = new FileReader;

    reader.onload = (event) => {
      const base64String = event.target.result.split(',')[1];
      console.log('Setting new local storage value')
      localStorage.setItem('uploaded_image', base64String);
      setCurrentImage(base64String);
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      setError('Error reading file');
    };

    reader.readAsDataURL(file);

    fetchImages(setImages, setError, setFetching);

  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div className="drag-drop">
      <img src={`data:image/jpeg;charset=utf-8;base64, ${currentImage}`} 
               {...getRootProps()}
               alt="Original Photo" className="original-photo-image" />
      <input {...getInputProps()} />
    </div>
  );
};

export default Dropzone;