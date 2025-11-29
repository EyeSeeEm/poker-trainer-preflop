import { useState } from 'react'
import Settings from './components/Settings'
import Quiz from './components/Quiz'
import './App.css'

function App() {
  const [gameState, setGameState] = useState('settings'); // 'settings' or 'quiz'
  const [selectedScenarios, setSelectedScenarios] = useState([]);

  const handleStartTraining = (scenarios) => {
    setSelectedScenarios(scenarios);
    setGameState('quiz');
  };

  const handleBackToSettings = () => {
    setGameState('settings');
  };

  return (
    <div className="app">
      {gameState === 'settings' ? (
        <Settings onStartTraining={handleStartTraining} />
      ) : (
        <Quiz
          scenarios={selectedScenarios}
          onBack={handleBackToSettings}
        />
      )}
    </div>
  )
}

export default App
