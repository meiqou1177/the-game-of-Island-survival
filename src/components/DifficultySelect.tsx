import { useState } from 'react';
import { ArrowLeft, Shield, Sword, Skull } from 'lucide-react';
import type { Difficulty } from '@/types/game';

interface DifficultySelectProps {
  onSelect: (difficulty: Difficulty) => void;
  onBack: () => void;
}

const DIFFICULTIES: {
  id: Difficulty;
  name: string;
  nameZh: string;
  desc: string;
  icon: typeof Shield;
  color: string;
  borderColor: string;
  bgGradient: string;
  features: string[];
}[] = [
  {
    id: 'easy',
    name: 'EXPLORER',
    nameZh: '探险者',
    desc: '适合新手，资源充足',
    icon: Shield,
    color: '#2ECC71',
    borderColor: '#27AE60',
    bgGradient: 'from-green-900/80 to-green-800/60',
    features: ['单词较短 (3-5字母)', '敌人HP -20%', '资源丰富', '时间限制: 8秒'],
  },
  {
    id: 'normal',
    name: 'SURVIVOR',
    nameZh: '幸存者',
    desc: '标准体验，考验平衡',
    icon: Sword,
    color: '#E67E22',
    borderColor: '#D35400',
    bgGradient: 'from-orange-900/80 to-orange-800/60',
    features: ['单词中等 (5-8字母)', '标准敌人属性', '正常资源', '时间限制: 6秒'],
  },
  {
    id: 'hard',
    name: 'HARDCORE',
    nameZh: '硬核',
    desc: '极限挑战，死亡常伴',
    icon: Skull,
    color: '#E74C3C',
    borderColor: '#C0392B',
    bgGradient: 'from-red-900/80 to-red-800/60',
    features: ['单词较长 (6-12字母)', '敌人HP +30%', '资源稀缺', '时间限制: 4秒'],
  },
];

export function DifficultySelect({ onSelect, onBack }: DifficultySelectProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (diff: Difficulty) => {
    setSelected(diff);
    setTimeout(() => onSelect(diff), 300);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#1a1a2e]">
      {/* 背景 */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: 'url(/assets/title_bg.jpg)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

      {/* 内容 */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        {/* 返回按钮 */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
          style={{ fontFamily: 'monospace' }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </button>

        {/* 标题 */}
        <h2
          className="text-3xl md:text-4xl font-bold mb-2"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            color: '#ECF0F1',
            textShadow: '2px 2px 0 #2C3E50, 4px 4px 0 #000',
          }}
        >
          选择难度
        </h2>
        <p className="text-gray-400 mb-8" style={{ fontFamily: 'monospace' }}>
          你的选择将决定生存体验
        </p>

        {/* 难度卡片 */}
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-3xl">
          {DIFFICULTIES.map((diff) => {
            const Icon = diff.icon;
            const isHovered = hovered === diff.id;
            const isSelected = selected === diff.id;

            return (
              <button
                key={diff.id}
                onMouseEnter={() => setHovered(diff.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleSelect(diff.id)}
                className={`relative flex-1 p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                  isSelected ? 'scale-95 opacity-80' : ''
                } ${isHovered ? 'scale-105 shadow-xl' : ''}`}
                style={{
                  borderColor: isHovered || isSelected ? diff.color : diff.borderColor + '60',
                  background: `linear-gradient(135deg, ${diff.bgGradient.includes('green') ? 'rgba(46, 204, 113, 0.15)' : diff.bgGradient.includes('orange') ? 'rgba(230, 126, 34, 0.15)' : 'rgba(231, 76, 60, 0.15)'}, rgba(0,0,0,0.6))`,
                  boxShadow: isHovered ? `0 0 30px ${diff.color}30` : 'none',
                }}
              >
                {/* 图标 */}
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: diff.color + '20', border: `2px solid ${diff.color}40` }}
                >
                  <Icon className="w-6 h-6" style={{ color: diff.color }} />
                </div>

                {/* 名称 */}
                <h3
                  className="text-xl font-bold mb-1"
                  style={{ color: diff.color, fontFamily: '"Press Start 2P", monospace', fontSize: '0.9rem' }}
                >
                  {diff.name}
                </h3>
                <p className="text-gray-300 text-sm mb-1" style={{ fontFamily: 'monospace' }}>
                  {diff.nameZh}
                </p>
                <p className="text-gray-500 text-xs mb-4">{diff.desc}</p>

                {/* 特性列表 */}
                <ul className="space-y-1">
                  {diff.features.map((feat, i) => (
                    <li
                      key={i}
                      className="text-xs flex items-center gap-2"
                      style={{ color: diff.color + 'CC', fontFamily: 'monospace' }}
                    >
                      <span style={{ color: diff.color }}>+</span>
                      {feat}
                    </li>
                  ))}
                </ul>

                {/* 选中指示 */}
                {isHovered && (
                  <div
                    className="absolute bottom-4 right-4 px-3 py-1 rounded text-xs font-bold"
                    style={{ backgroundColor: diff.color, color: '#000', fontFamily: 'monospace' }}
                  >
                    选择
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 底部提示 */}
        <p className="mt-8 text-gray-500 text-xs" style={{ fontFamily: 'monospace' }}>
          难度可以随时在设置中更改
        </p>
      </div>
    </div>
  );
}
