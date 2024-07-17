import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import OriginalImage from '../assets/image.jpeg'
import './Dropzone.css'

const Dropzone = ({ onUploadSuccess }) => {
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
      onUploadSuccess(response.data.images);
    })
    .catch((error) => {
      console.error('Error uploading file:', error);
    });
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()} className="drag-drop-box">
      <img src={OriginalImage} alt="Original Photo" className="original-photo-image" />
      <input {...getInputProps()} />
    </div>
  );
};

export default Dropzone;