import React, { createContext, useState } from 'react';

export const ImageContext = createContext();

export const ImageProvider = ({ children }) => {
  const [images, setImages] = useState([]);
  const [currentImage, setCurrentImage] = useState('');

  const [searchText, setSearchText] = useState([]);

  return (
    <ImageContext.Provider value={{ images, setImages, currentImage, setCurrentImage, searchText, setSearchText }}>
      {children}
    </ImageContext.Provider>
  );
};
