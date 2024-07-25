import React, { useContext, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import OriginalImage from '../assets/image.jpeg';
import { ImageContext } from './ImageContext';
import { fetchImages } from './ImageFetch';
import './Dropzone.css';

const Dropzone = () => {
  const { setImages } = useContext(ImageContext);
  const [fetching, setFetching] = useState();
  const [error, setError] = useState();
  const onDrop = useCallback((acceptedFiles) => {
    const formData = new FormData();
    formData.append('file', acceptedFiles[0]);

    axios.post('http://localhost:8000/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then((response) => {
      console.log(response.data);
      fetchImages(setImages, setError, setFetching);
    })
    .catch((error) => {
      console.error('Error uploading file:', error);
    });
  });

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div className="drag-drop">
      <img src={OriginalImage} 
               {...getRootProps()}
               alt="Original Photo" className="original-photo-image" />
      <input {...getInputProps()} />
    </div>
  );
};

export default Dropzone;