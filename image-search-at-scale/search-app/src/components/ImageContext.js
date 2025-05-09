import React, { createContext, useState } from 'react';

export const ImageContext = createContext();

export const ImageProvider = ({ children }) => {
  const [images, setImages] = useState([]);
  const [currentImage, setCurrentImage] = useState('');
  const [searchText, setSearchText] = useState('');
  const [fetching, setFetching] = useState(false);

  return (
    <ImageContext.Provider value={{ 
      images, 
      setImages, 
      currentImage, 
      setCurrentImage, 
      searchText, 
      setSearchText,
      fetching,
      setFetching,
    }}>
      {children}
    </ImageContext.Provider>
  );
};