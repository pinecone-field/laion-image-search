import React, { useState, useEffect } from 'react';

const QueryTime = () => {
  const [queryTime, setQueryTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQueryTime = async () => {
      try {
        const response = await fetch('http://localhost:8000/query-time'); 
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setQueryTime(data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchQueryTime();
  }, []);

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {queryTime && (
        <p>Query time: {queryTime}</p>
      )}
    </div>
  );
};

export default QueryTime;