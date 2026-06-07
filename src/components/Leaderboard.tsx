import { useState } from 'react';
import { ArrowLeft, Trophy, Calendar, Swords, Filter } from 'lucide-react';
import type { LeaderboardEntry, Difficulty } from '@/types/game';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  onBack: () => void;
}

type FilterType = 'all' | Difficulty;

export function Leaderboard({ entries, onBack }: LeaderboardProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredEntries = filter === 'all'
    ? entries
    : entries.filter(e => e.difficulty === filter);

  const diffColors: Record<string, string> = {
    easy: '#2ECC71',
    normal: '#E67E22',
    hard: '#E74C3C',
  };

  const diffNames: Record<string, string> = {
    easy: '探险者',
    normal: '幸存者',
    hard: '硬核',
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#1a1a2e]">
      {/* 背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/30 via-black to-black" />

      {/* 内容 */}
      <div className="relative z-10 flex flex-col h-full">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            style={{ fontFamily: 'monospace' }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>
          <h2
            className="text-xl font-bold text-yellow-400"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            <Trophy className="w-5 h-5 inline mr-2" />
            排行榜
          </h2>
          <div className="w-16" />
        </div>

        {/* 筛选器 */}
        <div className="p-3 border-b border-gray-700 flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          {(['all', 'easy', 'normal', 'hard'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                filter === f
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              style={{ fontFamily: 'monospace' }}
            >
              {f === 'all' ? '全部' : diffNames[f]}
            </button>
          ))}
        </div>

        {/* 列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredEntries.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p style={{ fontFamily: 'monospace' }}>暂无记录</p>
              <p className="text-xs mt-2">完成一局游戏后你的分数将出现在这里</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-2">
              {/* 表头 */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs text-gray-500" style={{ fontFamily: 'monospace' }}>
                <div className="col-span-1">#</div>
                <div className="col-span-3">玩家</div>
                <div className="col-span-2 text-right">分数</div>
                <div className="col-span-2 text-center">天数</div>
                <div className="col-span-2 text-center">击杀</div>
                <div className="col-span-2 text-center">难度</div>
              </div>

              {filteredEntries.map((entry, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-12 gap-2 px-4 py-3 rounded-lg items-center ${
                    i === 0 ? 'bg-yellow-900/20 border border-yellow-600/30' :
                    i === 1 ? 'bg-gray-700/20 border border-gray-500/30' :
                    i === 2 ? 'bg-orange-900/10 border border-orange-600/20' :
                    'bg-gray-800/40 border border-gray-700/30'
                  }`}
                >
                  <div className="col-span-1">
                    <span className={`text-sm font-bold ${
                      i === 0 ? 'text-yellow-400' :
                      i === 1 ? 'text-gray-300' :
                      i === 2 ? 'text-orange-400' :
                      'text-gray-500'
                    }`}>
                      {i + 1}
                    </span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-sm text-white font-medium" style={{ fontFamily: 'monospace' }}>
                      {entry.playerName}
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-sm text-yellow-400 font-bold" style={{ fontFamily: 'monospace' }}>
                      {entry.score}
                    </span>
                  </div>
                  <div className="col-span-2 text-center flex items-center justify-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-300">{entry.daysSurvived}</span>
                  </div>
                  <div className="col-span-2 text-center flex items-center justify-center gap-1">
                    <Swords className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-300">{entry.kills}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: diffColors[entry.difficulty] + '20',
                        color: diffColors[entry.difficulty],
                        fontFamily: 'monospace',
                      }}
                    >
                      {diffNames[entry.difficulty]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
