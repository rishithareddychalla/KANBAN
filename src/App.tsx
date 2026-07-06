import { Board } from './components/Board/Board';
import { Heart } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-start w-full">
        <Board />
      </main>

      {/* Premium Footer */}
      <footer className="w-full border-t border-white/5 py-4 bg-slate-950/40 backdrop-blur-md text-center text-xs text-slate-500 font-sans flex items-center justify-center gap-1.5 select-none mt-12">
        <span>Made with</span>
        <Heart size={12} className="text-rose-500 fill-rose-500 animate-pulse" />
        <span>for modern workspaces • © {new Date().getFullYear()} TaskFlow Inc.</span>
      </footer>
    </div>
  );
}

export default App;
