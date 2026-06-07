import { useState, useEffect } from 'react';
import { Trophy, Star, Calendar, Swords, Home, RotateCcw, Sparkles, Rocket } from 'lucide-react';
import type { PlayerState, Difficulty } from '@/types/game';

interface VictoryScreenProps {
  player: PlayerState;
  difficulty: Difficulty;
  onRestart: () => void;
  onMenu: () => void;
  onSaveScore: (name: string) => void;
}

export function VictoryScreen({ player, difficulty, onRestart, onMenu, onSaveScore }: VictoryScreenProps) {
  const [playerName, setPlayerName] = useState('');
  const [saved, setSaved] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [fireworks, setFireworks] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);

  useEffect(() => {
    setTimeout(() => setShowContent(true), 500);
    
    // 烟花效果
    const interval = setInterval(() => {
      setFireworks(prev => [
        ...prev.slice(-10),
        {
          id: Date.now(),
          x: Math.random() * 100,
          y: Math.random() * 50,
          color: ['#E67E22', '#8E44AD', '#2ECC71', '#E74C3C', '#f39c12'][Math.floor(Math.random() * 5)],
        },
      ]);
    }, 800);
    
    return () => clearInterval(interval);
  }, []);

  const handleSave = () => {
    if (playerName.trim()) {
      onSaveScore(playerName.trim());
      setSaved(true);
    }
  };

  const diffNames: Record<Difficulty, string> = {
    easy: '探险者',
    normal: '幸存者',
    hard: '硬核',
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#1a1a2e]">
      {/* 金色渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/30 via-purple-900/20 to-black" />
      
      {/* 烟花 */}
      {fireworks.map(fw => (
        <div
          key={fw.id}
          className="absolute animate-ping"
          style={{
            left: `${fw.x}%`,
            top: `${fw.y}%`,
            width: '10px',
            height: '10px',
            backgroundColor: fw.color,
            borderRadius: '50%',
            animationDuration: '1s',
          }}
        />
      ))}

      {/* 飘浮粒子 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full animate-float"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 23) % 100}%`,
              backgroundColor: ['#E67E22', '#8E44AD', '#2ECC71', '#f39c12'][i % 4],
              opacity: 0.4 + Math.random() * 0.4,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* 内容 */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        <div
          className={`text-center transition-all duration-1000 ${
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'
          }`}
        >
          {/* 胜利图标 */}
          <div className="mb-4 flex justify-center">
            <div className="relative">
              <Rocket className="w-16 h-16 text-orange-400 animate-bounce" />
              <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-2 -right-2 animate-spin" />
            </div>
          </div>

          {/* 标题 */}
          <h1
            className="text-4xl md:text-6xl font-bold mb-2"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              color: '#E67E22',
              textShadow: '3px 3px 0 #8B4513, 0 0 30px rgba(230, 126, 34, 0.5)',
            }}
          >
            VICTORY
          </h1>
          <p className="text-xl text-gray-300 mb-2" style={{ fontFamily: 'monospace' }}>
            你成功逃离了荒岛！
          </p>
          <p className="text-sm text-purple-400 mb-8" style={{ fontFamily: 'monospace' }}>
            击败拼装之主，呼叫了救援
          </p>

          {/* 统计面板 */}
          <div className="bg-gray-900/80 border border-yellow-600/50 rounded-xl p-6 mb-8 w-full max-w-md mx-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <Calendar className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                  {player.daysSurvived}
                </p>
                <p className="text-xs text-gray-400">存活天数</p>
              </div>
              <div className="text-center">
                <Swords className="w-5 h-5 text-red-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                  {player.kills}
                </p>
                <p className="text-xs text-gray-400">击杀数</p>
              </div>
              <div className="text-center">
                <Star className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-white" style={{ fontFamily: 'monospace' }}>
                  {diffNames[difficulty]}
                </p>
                <p className="text-xs text-gray-400">难度</p>
              </div>
              <div className="text-center">
                <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'monospace' }}>
                  {player.score}
                </p>
                <p className="text-xs text-gray-400">总得分</p>
              </div>
            </div>
          </div>

          {/* 保存分数 */}
          {!saved ? (
            <div className="flex gap-2 mb-6 w-full max-w-md mx-auto">
              <input
                type="text"
                placeholder="输入你的名字..."
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500"
                style={{ fontFamily: 'monospace' }}
                maxLength={12}
              />
              <button
                onClick={handleSave}
                disabled={!playerName.trim()}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-bold text-sm transition-colors"
                style={{ fontFamily: 'monospace' }}
              >
                <Trophy className="w-4 h-4 inline mr-1" />
                保存
              </button>
            </div>
          ) : (
            <p className="text-green-400 mb-6 text-sm" style={{ fontFamily: 'monospace' }}>
              分数已保存！你是真正的生存大师！
            </p>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={onRestart}
              className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold transition-all hover:scale-105"
              style={{ fontFamily: 'monospace' }}
            >
              <RotateCcw className="w-5 h-5" />
              再玩一次
            </button>
            <button
              onClick={onMenu}
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-all hover:scale-105"
              style={{ fontFamily: 'monospace' }}
            >
              <Home className="w-5 h-5" />
              主菜单
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
