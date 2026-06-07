import { useState, useEffect } from 'react';
import { Play, Trophy, Settings, HelpCircle, ChevronRight } from 'lucide-react';

interface MainMenuProps {
  onStart: () => void;
  onLeaderboard: () => void;
  onSettings: () => void;
  onTutorial: () => void;
}

export function MainMenu({ onStart, onLeaderboard, onSettings, onTutorial }: MainMenuProps) {
  const [showTitle, setShowTitle] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [particleOffset, setParticleOffset] = useState(0);

  useEffect(() => {
    setTimeout(() => setShowTitle(true), 300);
    setTimeout(() => setShowButtons(true), 800);
  }, []);

  // 粒子动画
  useEffect(() => {
    const interval = setInterval(() => {
      setParticleOffset(prev => (prev + 0.5) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#1a1a2e]">
      {/* 背景图 */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-60"
        style={{ backgroundImage: 'url(/assets/title_bg.jpg)' }}
      />
      
      {/* 暗色遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
      
      {/* 飘浮粒子 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-60"
            style={{
              left: `${(i * 37 + particleOffset) % 100}%`,
              top: `${(i * 23 + Math.sin(particleOffset * 0.1 + i) * 10) % 100}%`,
              opacity: 0.3 + Math.sin(particleOffset * 0.05 + i) * 0.3,
              transform: `scale(${0.5 + Math.sin(particleOffset * 0.03 + i) * 0.5})`,
            }}
          />
        ))}
      </div>

      {/* 主内容 */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        {/* 标题 */}
        <div
          className={`text-center transition-all duration-1000 ${
            showTitle ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'
          }`}
        >
          <h1
            className="text-5xl md:text-7xl font-bold tracking-wider mb-2"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              color: '#E67E22',
              textShadow: '3px 3px 0 #8B4513, 6px 6px 0 #000, 0 0 20px rgba(230, 126, 34, 0.5)',
            }}
          >
            WORD
          </h1>
          <h2
            className="text-3xl md:text-5xl font-bold tracking-wider mb-4"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              color: '#ECF0F1',
              textShadow: '2px 2px 0 #2C3E50, 4px 4px 0 #000',
            }}
          >
            SURVIVAL
          </h2>
          <p
            className="text-lg md:text-xl tracking-widest"
            style={{
              color: '#8E44AD',
              textShadow: '1px 1px 0 #000',
              fontFamily: 'monospace',
            }}
          >
            ISLAND
          </p>
          <div className="mt-4 w-48 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto" />
        </div>

        {/* 按钮组 */}
        <div
          className={`mt-12 flex flex-col gap-4 w-full max-w-xs transition-all duration-700 ${
            showButtons ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <button
            onClick={onStart}
            className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold text-lg rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30 border-2 border-orange-400"
            style={{ fontFamily: 'monospace' }}
          >
            <Play className="w-5 h-5" />
            <span>开始生存</span>
            <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            onClick={onLeaderboard}
            className="group flex items-center justify-center gap-3 px-8 py-3 bg-gradient-to-r from-purple-800 to-purple-700 hover:from-purple-700 hover:to-purple-600 text-white font-bold rounded-lg transition-all duration-200 hover:scale-105 border-2 border-purple-500"
            style={{ fontFamily: 'monospace' }}
          >
            <Trophy className="w-5 h-5" />
            <span>排行榜</span>
          </button>

          <div className="flex gap-3">
            <button
              onClick={onTutorial}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 font-bold rounded-lg transition-all duration-200 hover:scale-105 border border-gray-600"
              style={{ fontFamily: 'monospace' }}
            >
              <HelpCircle className="w-4 h-4" />
              <span>教程</span>
            </button>
            <button
              onClick={onSettings}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 font-bold rounded-lg transition-all duration-200 hover:scale-105 border border-gray-600"
              style={{ fontFamily: 'monospace' }}
            >
              <Settings className="w-4 h-4" />
              <span>设置</span>
            </button>
          </div>
        </div>

        {/* 底部提示 */}
        <p
          className={`absolute bottom-8 text-gray-500 text-xs tracking-wider transition-all duration-1000 delay-1000 ${
            showButtons ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ fontFamily: 'monospace' }}
        >
          v1.0 - 在荒岛上靠单词挑战活下去
        </p>
      </div>
    </div>
  );
}
