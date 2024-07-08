import React, {useState, useEffect} from 'react'
import api from './api'
import ImageFetch from './ImageFetch';
import DataTable from './DataTable';

const App = () => {
  return (
    <div>
      <h1>My Data table</h1>
      <ImageFetch/>
    </div>
  );
};



export default App;
