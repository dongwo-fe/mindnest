import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import Layout from './components/Layout';
import Home from './pages/Home'
import Editor from './pages/Editor';
import Settings from './pages/Settings';
// import { WindowControls } from './components/WindowControls';

export default function App() {
  return (
    <Router>
      <Layout>
        {/* <WindowControls /> */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/editor/:noteId?" element={<Editor />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  )
}
