import React, { createContext, useState } from 'react';

export const ImageContext = createContext();

export const ImageProvider = ({ children }) => {
  const [images, setImages] = useState([]);

  const [searchText, setSearchText] = useState([]);

  return (
    <ImageContext.Provider value={{ images, setImages, searchText, setSearchText }}>
      {children}
    </ImageContext.Provider>
  );
};
