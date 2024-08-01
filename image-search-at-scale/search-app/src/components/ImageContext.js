import React, { createContext, useState } from 'react';

export const ImageContext = createContext();

export const ImageProvider = ({ children }) => {
  const [images, setImages] = useState([]);
  const [currentImage, setCurrentImage] = useState('');

  return (
    <ImageContext.Provider value={{ images, setImages, currentImage, setCurrentImage }}>
      {children}
    </ImageContext.Provider>
  );
};
