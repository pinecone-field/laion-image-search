// Dropzone.js
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

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
      <input {...getInputProps()} />
      <p>Drag and drop an image here</p>
    </div>
  );
};

export default Dropzone;