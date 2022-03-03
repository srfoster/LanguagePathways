import React, {useEffect,useState} from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useParams
} from "react-router-dom";
import logo from './logo.svg';
import './App.css';

import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';



function App() {
  return (
    <>
      <Container>
        <BrowserRouter>
          <Routes>
            <Route path="/users/:user_id" element={<RandomSentence/>} />
          </Routes>
         </BrowserRouter>
      </Container>
    </>
  );
}


function RandomSentence() {
  let params = useParams();
 
  let [count,setCount] = useState(0)
  let [sentence,setSentence] = useState(undefined)
  let [targets,setTargets] = useState(undefined)
  let [loadingTargets,setLoadingTargets] = useState(false)
  
  useEffect(()=>{
    fetch(`http://localhost:8000/users/${params.user_id}/sentences/random`)
    .then(response => response.json())
    .then(data => {
      setSentence(data)
    }); 
  }, [count])

  const getTargets = ()=>{
    setLoadingTargets(true)
    fetch(`http://localhost:8000/users/${params.user_id}/sentences/${sentence.id}`)
    .then(response => response.json())
    .then(data => {
      setTargets(data.targets)
      setLoadingTargets(false)
    }); 
  }

  return <Card>
    <CardContent>
       {sentence && <>{sentence.data}
         {/* <Button onClick={()=>{
             let utt = new SpeechSynthesisUtterance(sentence.data)
             window.speechSynthesis.speak( utt)
         }}>Say English</Button> */}
       </>}
       <div>
         <Button onClick={getTargets}>Continue</Button>
       </div>
       {loadingTargets && <p>Loading...</p>}
       {targets && targets.map((t)=><p>{t.data}</p>)}
     </CardContent>
 
     <div>
       <Button onClick={()=>{
         setCount((count)=>count+1) 
         setTargets(undefined)
       }}>Next</Button>
     </div>
   </Card>
}

export default App;
