import React, {useEffect,useState} from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  let [attempts,setAttempts] = useState(undefined)
  
  useEffect(()=>{
    fetch("http://localhost:8000/users/stephenfoster/unattempted")
    .then(response => response.json())
    .then(data => {
      setAttempts(data)
    }); 
  }, [])
  return (
    <div className="App">
      <header className="App-header">
        {attempts ? JSON.stringify(attempts) : ""} 
      </header>
    </div>
  );
}

export default App;
