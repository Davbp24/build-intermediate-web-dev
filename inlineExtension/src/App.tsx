
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Notes from './components/Notes';
import Draw from './components/Draw';
import Rewrite from './components/Rewrite';
import AI from './components/AI';
import Highlighter from './components/Highlighter';
import Settings from './components/Settings';

import './App.css'

function App() {

  return (
    <>
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path='/settings' element={<Settings/>}/>
        <Route path="/notes" element={<Notes />} />
        <Route path="/draw" element={<Draw />} />
        <Route path="/rewrite" element={<Rewrite />} />
        <Route path='/ai' element={<AI />} />
        <Route path='/highlighter' element={<Highlighter />} />
      </Routes>
    </MemoryRouter>
    </>
  )
}

export default App
