import { HashRouter, Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import WorkoutEditorPage from './pages/WorkoutEditorPage'
import ExerciseProgressPage from './pages/ExerciseProgressPage'
import StatsPage from './pages/StatsPage'
import SettingsPage from './pages/SettingsPage'

// HashRouter keeps deep links working on any static host (and in an installed
// PWA) without server-side SPA fallback config.
export default function App() {
  return (
    <HashRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/workout/:id" element={<WorkoutEditorPage />} />
          <Route path="/progress" element={<ExerciseProgressPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        <BottomNav />
      </div>
    </HashRouter>
  )
}
