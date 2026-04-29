import React from 'react'
import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import { ThemeProvider } from './components/theme-provider'
import { TooltipProvider } from './components/ui/tooltip'

const App = () => {
  return (
    <ThemeProvider defaultTheme='dark' storageKey='chat-bot-theme'>
      <TooltipProvider>
        <Routes>
          <Route path='/' element={<HomePage />} />
        </Routes>
      </TooltipProvider>
    </ThemeProvider>
  )
}

export default App
