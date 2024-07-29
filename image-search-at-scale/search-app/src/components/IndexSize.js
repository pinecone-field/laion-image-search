import React, { useState, useEffect } from 'react';
import configData from './config.json';

const IndexSize = () => {
  const [indexSize, setIndexSize] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const SERVER_URL = configData.SERVER_URL+"/index-size";

  useEffect(() => {
    const fetchIndexSize = async () => {
      try {
        const response = await fetch(SERVER_URL); 
        if (!response.ok) {
          throw new Error("Network response was: ", response.error);
        }
        const data = await response.json();
        setIndexSize(data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchIndexSize();
  }, []);

  var nf = new Intl.NumberFormat();

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {indexSize && (
        <p>Index Size: {nf.format(indexSize)}</p>
      )}
    </div>
  );
};

export default IndexSize;