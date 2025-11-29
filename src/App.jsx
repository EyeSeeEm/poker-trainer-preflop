import { useState } from 'react'
import Settings from './components/Settings'
import Quiz from './components/Quiz'
import './App.css'

function App() {
  const [gameState, setGameState] = useState('settings'); // 'settings' or 'quiz'
  const [selectedScenarios, setSelectedScenarios] = useState([]);
  const [blinds, setBlinds] = useState({ sb: 5, bb: 5 });
  const [difficulty, setDifficulty] = useState('medium');

  const handleStartTraining = (scenarios, selectedBlinds, selectedDifficulty) => {
    setSelectedScenarios(scenarios);
    setBlinds(selectedBlinds);
    setDifficulty(selectedDifficulty);
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
          blinds={blinds}
          difficulty={difficulty}
          onBack={handleBackToSettings}
        />
      )}
    </div>
  )
}

export default App
