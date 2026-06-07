import { useState } from 'react';
import { Skull, RotateCcw, Home, Trophy, Heart, Calendar, Swords } from 'lucide-react';
import type { PlayerState, Difficulty } from '@/types/game';

interface GameOverProps {
  player: PlayerState;
  difficulty: Difficulty;
  mapReached: string;
  onRestart: () => void;
  onMenu: () => void;
  onSaveScore: (name: string) => void;
}

export function GameOver({ player, difficulty, mapReached, onRestart, onMenu, onSaveScore }: GameOverProps) {
  const [playerName, setPlayerName] = useState('');
  const [saved, setSaved] = useState(false);

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
      {/* 暗红背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/50 via-black to-black" />
      
      {/* 血迹效果 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-red-900/20"
            style={{
              width: `${50 + Math.random() * 100}px`,
              height: `${50 + Math.random() * 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              filter: 'blur(20px)',
            }}
          />
        ))}
      </div>

      {/* 内容 */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        {/* 死亡图标 */}
        <div className="mb-6 animate-pulse">
          <Skull className="w-20 h-20 text-red-600" />
        </div>

        {/* 标题 */}
        <h1
          className="text-4xl md:text-6xl font-bold mb-2 text-red-600"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            textShadow: '3px 3px 0 #000, 0 0 30px rgba(231, 76, 60, 0.5)',
          }}
        >
          YOU DIED
        </h1>
        <p className="text-gray-400 mb-8" style={{ fontFamily: 'monospace' }}>
          你的荒岛生存之旅结束了
        </p>

        {/* 统计面板 */}
        <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-6 mb-8 w-full max-w-md">
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
              <Heart className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-white" style={{ fontFamily: 'monospace' }}>
                {mapReached}
              </p>
              <p className="text-xs text-gray-400">到达区域</p>
            </div>
            <div className="text-center">
              <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'monospace' }}>
                {player.score}
              </p>
              <p className="text-xs text-gray-400">总得分</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700 text-center">
            <span className="text-xs text-gray-500" style={{ fontFamily: 'monospace' }}>
              难度: {diffNames[difficulty]}
            </span>
          </div>
        </div>

        {/* 保存分数 */}
        {!saved ? (
          <div className="flex gap-2 mb-6 w-full max-w-md">
            <input
              type="text"
              placeholder="输入你的名字..."
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
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
            分数已保存到排行榜！
          </p>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-4">
          <button
            onClick={onRestart}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold transition-all hover:scale-105"
            style={{ fontFamily: 'monospace' }}
          >
            <RotateCcw className="w-5 h-5" />
            再试一次
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
  );
}
