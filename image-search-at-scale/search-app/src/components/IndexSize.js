import React, { useState, useEffect } from 'react';

const IndexSize = () => {
  const [indexSize, setIndexSize] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIndexSize = async () => {
      try {
        const response = await fetch('http://localhost:8000/index-size'); 
        if (!response.ok) {
          throw new Error('Network response was not ok');
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