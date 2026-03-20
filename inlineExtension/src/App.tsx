import { useState } from 'react'
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Notes from './components/Notes';
import Draw from './components/Draw';
import Rewrite from './components/Rewrite';
import AI from './components/AIFeature';
import Highlighter from './components/Highlighter';

import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/notes" element={<Notes />} />
        <Route path="/draw" element={<Draw />} />
        <Route path="/rewrite" element={<Rewrite />} />
        <Route path='/ai' element={<AIFeature />} />
        <Route path='highlighter' element={<Highlighter />} />
      </Routes>
    </MemoryRouter>
    </>
  )
}

export default App
