import { useEffect, useState, useMemo } from 'react';
import { Clock, Zap, Shield, Swords, Sparkles } from 'lucide-react';
import type { CombatState, PlayerState, PetState, Enemy } from '@/types/game';

interface CombatScreenProps {
  combat: CombatState;
  player: PlayerState;
  pet: PetState;
  onAnswer: (optionIndex: number) => void;
  onSwitchWeapon: (weaponId: string) => void;
  onActivateDodge: () => void;
  onEnemyTurn: () => void;
}

const OPTION_BG = ['bg-red-700/60 hover:bg-red-600/80', 'bg-blue-700/60 hover:bg-blue-600/80', 'bg-green-700/60 hover:bg-green-600/80', 'bg-yellow-700/60 hover:bg-yellow-600/80'];
const OPTION_BORDER = ['border-red-400/60', 'border-blue-400/60', 'border-green-400/60', 'border-yellow-400/60'];

/** 单个行动项 */
interface TurnAction {
  id: string;
  name: string;
  type: 'player' | 'enemy' | 'player_skill' | 'enemy_skill' | 'pursuit';
  desc: string;
  color: string;
  bgColor: string;
}

/** 根据当前战斗状态计算未来3个回合的行动序列 */
function calculateTurnOrder(
  combat: CombatState,
  playerWeaponName: string,
  playerWeaponDmg: number,
  enemy: Enemy
): TurnAction[] {
  const actions: TurnAction[] = [];
  let turnNum = 1;
  let actionIdx = 0;

  const isPlayerPhase = combat.phase === 'player' && !combat.answered;
  const isEnemyPhase = combat.phase === 'enemy';
  const hasDodgeActive = combat.dodgeActive;

  // 如果当前是玩家回合且还没答题
  if (isPlayerPhase) {
    actions.push({
      id: `t${turnNum}_p${actionIdx++}`,
      name: '航天员',
      type: 'player',
      desc: `${playerWeaponName} 攻击 (${playerWeaponDmg}伤害)`,
      color: '#E67E22',
      bgColor: 'rgba(230,126,34,0.15)',
    });

    if (enemy.hasDoubleDamage) {
      actions.push({
        id: `t${turnNum}_es${actionIdx++}`,
        name: `${enemy.nameZh}·技能`,
        type: 'enemy_skill',
        desc: `30%概率双倍伤害`,
        color: '#E74C3C',
        bgColor: 'rgba(231,76,60,0.15)',
      });
    }
    if (enemy.hasDodge && enemy.type !== 'boss') {
      actions.push({
        id: `t${turnNum}_es${actionIdx++}`,
        name: `${enemy.nameZh}·技能`,
        type: 'enemy_skill',
        desc: `30%概率闪避`,
        color: '#E74C3C',
        bgColor: 'rgba(231,76,60,0.15)',
      });
    }
    if (enemy.type === 'boss' && (enemy.skillCooldown || 0) === 0) {
      actions.push({
        id: `t${turnNum}_es${actionIdx++}`,
        name: `${enemy.nameZh}·技能`,
        type: 'enemy_skill',
        desc: `闪避/召唤/回血`,
        color: '#E74C3C',
        bgColor: 'rgba(231,76,60,0.15)',
      });
    }

    actions.push({
      id: `t${turnNum}_e${actionIdx++}`,
      name: enemy.nameZh,
      type: 'enemy',
      desc: `攻击 (${enemy.damage}伤害${enemy.damageType === 'magic' ? '·法' : ''})`,
      color: '#9B59B6',
      bgColor: 'rgba(155,89,182,0.15)',
    });
    turnNum++;
  }

  // 如果当前是敌方回合
  if (isEnemyPhase) {
    if (hasDodgeActive) {
      actions.push({
        id: `t${turnNum}_ps${actionIdx++}`,
        name: '航天员·技能',
        type: 'player_skill',
        desc: `闪避发动：规避伤害`,
        color: '#00D2FF',
        bgColor: 'rgba(0,210,255,0.2)',
      });
      actions.push({
        id: `t${turnNum}_pu${actionIdx++}`,
        name: '航天员·追击',
        type: 'pursuit',
        desc: `追击攻击 (${playerWeaponDmg}伤害·本回合)`,
        color: '#F1C40F',
        bgColor: 'rgba(241,196,15,0.2)',
      });
      actions.push({
        id: `t${turnNum}_e${actionIdx++}`,
        name: enemy.nameZh,
        type: 'enemy',
        desc: `反击 (${enemy.damage}伤害)`,
        color: '#9B59B6',
        bgColor: 'rgba(155,89,182,0.15)',
      });
    } else {
      if (enemy.hasDoubleDamage) {
        actions.push({
          id: `t${turnNum}_es${actionIdx++}`,
          name: `${enemy.nameZh}·技能`,
          type: 'enemy_skill',
          desc: `30%概率双倍伤害`,
          color: '#E74C3C',
          bgColor: 'rgba(231,76,60,0.15)',
        });
      }
      if (enemy.hasDodge && enemy.type !== 'boss') {
        actions.push({
          id: `t${turnNum}_es${actionIdx++}`,
          name: `${enemy.nameZh}·技能`,
          type: 'enemy_skill',
          desc: `30%概率闪避`,
          color: '#E74C3C',
          bgColor: 'rgba(231,76,60,0.15)',
        });
      }
      if (enemy.type === 'boss' && (enemy.skillCooldown || 0) === 0) {
        actions.push({
          id: `t${turnNum}_es${actionIdx++}`,
          name: `${enemy.nameZh}·技能`,
          type: 'enemy_skill',
          desc: `闪避/召唤/回血`,
          color: '#E74C3C',
          bgColor: 'rgba(231,76,60,0.15)',
        });
      }
      actions.push({
        id: `t${turnNum}_e${actionIdx++}`,
        name: enemy.nameZh,
        type: 'enemy',
        desc: `攻击 (${enemy.damage}伤害${enemy.damageType === 'magic' ? '·法' : ''})`,
        color: '#9B59B6',
        bgColor: 'rgba(155,89,182,0.15)',
      });
    }
    turnNum++;
  }

  // 预测接下来的回合
  while (turnNum <= 3) {
    actions.push({
      id: `t${turnNum}_p${actionIdx++}`,
      name: '航天员',
      type: 'player',
      desc: `${playerWeaponName} 攻击 (${playerWeaponDmg}伤害)`,
      color: '#E67E22',
      bgColor: 'rgba(230,126,34,0.15)',
    });

    if (enemy.hasDoubleDamage) {
      actions.push({
        id: `t${turnNum}_es${actionIdx++}`,
        name: `${enemy.nameZh}·技能`,
        type: 'enemy_skill',
        desc: `30%概率双倍伤害`,
        color: '#E74C3C',
        bgColor: 'rgba(231,76,60,0.15)',
      });
    }
    if (enemy.hasDodge && enemy.type !== 'boss') {
      actions.push({
        id: `t${turnNum}_es${actionIdx++}`,
        name: `${enemy.nameZh}·技能`,
        type: 'enemy_skill',
        desc: `30%概率闪避`,
        color: '#E74C3C',
        bgColor: 'rgba(231,76,60,0.15)',
      });
    }
    if (enemy.type === 'boss') {
      actions.push({
        id: `t${turnNum}_es${actionIdx++}`,
        name: `${enemy.nameZh}·技能`,
        type: 'enemy_skill',
        desc: `闪避/召唤/回血`,
        color: '#E74C3C',
        bgColor: 'rgba(231,76,60,0.15)',
      });
    }

    actions.push({
      id: `t${turnNum}_e${actionIdx++}`,
      name: enemy.nameZh,
      type: 'enemy',
      desc: `攻击 (${enemy.damage}伤害${enemy.damageType === 'magic' ? '·法' : ''})`,
      color: '#9B59B6',
      bgColor: 'rgba(155,89,182,0.15)',
    });
    turnNum++;
  }

  return actions;
}

/** 回合预览列表组件 */
function TurnOrderList({ combat, player, enemy }: { combat: CombatState; player: PlayerState; enemy: Enemy }) {
  const actions = useMemo(
    () => calculateTurnOrder(combat, player.currentWeapon.nameZh, player.currentWeapon.damage, enemy),
    [combat, player.currentWeapon.nameZh, player.currentWeapon.damage, enemy]
  );

  const getIcon = (type: TurnAction['type']) => {
    switch (type) {
      case 'player': return <Swords className="w-3.5 h-3.5" />;
      case 'enemy': return <Swords className="w-3.5 h-3.5" />;
      case 'player_skill': return <Shield className="w-3.5 h-3.5" />;
      case 'enemy_skill': return <Sparkles className="w-3.5 h-3.5" />;
      case 'pursuit': return <Zap className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="w-44 bg-gray-900/85 border border-gray-700/60 rounded-lg p-2 backdrop-blur-sm">
      <div className="text-center mb-1.5 pb-1 border-b border-gray-700/50">
        <span className="text-[10px] font-bold text-gray-400" style={{ fontFamily: 'monospace' }}>回合预览</span>
      </div>
      <div className="space-y-1 max-h-56 overflow-y-auto">
        {actions.map((action) => (
          <div
            key={action.id}
            className="flex items-center gap-1.5 px-1.5 py-1 rounded text-[10px]"
            style={{
              backgroundColor: action.bgColor,
              borderLeft: `2px solid ${action.color}`,
              fontFamily: 'monospace',
            }}
          >
            <span style={{ color: action.color }}>{getIcon(action.type)}</span>
            <div className="flex-1 min-w-0">
              <div className="text-gray-200 truncate text-[9px] font-bold">{action.name}</div>
              <div className="text-gray-500 truncate text-[8px]">{action.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-1.5 pt-1 border-t border-gray-700/50">
        <span className="text-[8px] text-gray-600" style={{ fontFamily: 'monospace' }}>未来3回合</span>
      </div>
    </div>
  );
}

export function CombatScreen({ combat, player, pet, onAnswer, onSwitchWeapon, onActivateDodge, onEnemyTurn }: CombatScreenProps) {
  const [resultFlash, setResultFlash] = useState<'correct' | 'wrong' | null>(null);

  const enemy = combat.currentEnemy ?? { id: '', type: 'sand' as const, name: '', nameZh: '', hp: 0, maxHp: 1, damage: 0, damageType: 'physical' as const, sprite: '', canMove: false };
  const question = combat.questions[combat.currentQuestionIndex];
  const timePercent = (combat.timeLeft / combat.maxTime) * 100;
  const hpPercent = Math.max(0, (player.hp / player.maxHp) * 100);
  const enemyHpPercent = Math.max(0, ((enemy?.hp ?? 0) / (enemy?.maxHp ?? 1)) * 100);

  const spriteMap: Record<string, string> = {
    sand: '/assets/enemy_sand.png', wood: '/assets/enemy_wood.png', stone: '/assets/enemy_stone.png',
    fly: '/assets/enemy_fly.png', boss: '/assets/enemy_boss.png',
  };

  // 敌方回合自动触发
  useEffect(() => {
    if (combat.phase === 'enemy') {
      const timer = setTimeout(() => onEnemyTurn(), 1200);
      return () => clearTimeout(timer);
    }
  }, [combat.phase, onEnemyTurn]);

  // 答题结果 - 边框发光提示
  useEffect(() => {
    if (combat.answered) {
      setResultFlash(combat.isCorrect ? 'correct' : 'wrong');
      const timer = setTimeout(() => setResultFlash(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [combat.answered, combat.isCorrect]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Q') {
        if (combat.dodgeReady && !combat.dodgeActive && !combat.dodgeUsed && combat.phase === 'player') {
          onActivateDodge();
        }
        return;
      }
      if (combat.phase !== 'player' || combat.answered || !question) return;
      if (e.key >= '1' && e.key <= '4') onAnswer(parseInt(e.key) - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [combat.phase, combat.answered, combat.dodgeReady, combat.dodgeActive, combat.dodgeUsed, question, onAnswer, onActivateDodge]);

  if (combat.phase !== 'pursuit' && !question) return null;

  const phaseTitle = combat.phase === 'player'
    ? { text: '★ 我方回合 ★', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/40' }
    : combat.phase === 'enemy' && combat.dodgeActive
    ? { text: '◆ 闪避 & 追击 ◆', color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/40' }
    : { text: '● 敌方回合 ●', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/40' };

  return (
    <div className="relative w-full h-screen bg-[#0d0d1a] flex flex-col overflow-hidden select-none">

      {/* 大回合标题 */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50">
        <div className={`px-6 py-2 rounded-full ${phaseTitle.bg} border-2 ${phaseTitle.border} backdrop-blur-sm`}>
          <span className={`text-sm font-bold ${phaseTitle.color}`} style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.7rem' }}>
            {phaseTitle.text}
          </span>
        </div>
      </div>

      {/* 回合预览列表（右上方） */}
      <div className="absolute top-3 right-3 z-40">
        <TurnOrderList combat={combat} player={player} enemy={enemy} />
      </div>

      {/* 顶部信息栏 */}
      <div className="relative z-20 pt-12 px-4">
        <div className="flex items-center justify-end gap-1 max-w-3xl mx-auto mb-2">
          {player.weapons.map((w) => (
            <button key={w.id} onClick={() => onSwitchWeapon(w.id)} className={`w-8 h-8 rounded border flex items-center justify-center text-xs transition-all ${player.currentWeapon.id === w.id ? 'border-orange-500 bg-orange-900/40 scale-110' : 'border-gray-600 bg-gray-800/40'}`} title={w.nameZh}>
              {w.type === 'ranged' ? '🔫' : '⚔'}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between max-w-3xl mx-auto gap-4 mb-2">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400" style={{ fontFamily: 'monospace' }}>航天员</span>
              <span className="text-[10px] text-white" style={{ fontFamily: 'monospace' }}>{Math.max(0, player.hp)}/{player.maxHp}</span>
            </div>
            <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
              <div className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-red-600 to-orange-500" style={{ width: `${hpPercent}%` }} />
            </div>
          </div>
          <div className="text-xl font-bold text-orange-500/60" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.7rem' }}>VS</div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-purple-300" style={{ fontFamily: 'monospace' }}>{enemy.nameZh}</span>
              <span className="text-[10px] text-white" style={{ fontFamily: 'monospace' }}>{Math.max(0, enemy.hp)}/{enemy.maxHp}</span>
            </div>
            <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
              <div className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-purple-600 to-pink-500" style={{ width: `${enemyHpPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 中央对峙区域 */}
      <div className="relative flex-1 flex items-center justify-center max-w-3xl mx-auto w-full px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-transparent to-orange-900/10" />
        <div className="relative z-10 flex items-end justify-between w-full gap-8">

          {/* 玩家角色 + 狗 */}
          <div className={`relative flex flex-col items-center ${combat.phase === 'player' ? 'hsr-turn-glow' : ''}`}>
            <div className="relative flex items-end gap-2">
              {/* 玩家 */}
              <div className="relative">
                <div className={`w-28 h-28 md:w-36 md:h-36 ${combat.phase === 'player' ? 'hsr-float' : ''}`}>
                  <img src="/assets/player_idle.png" alt="玩家" className="w-full h-full" style={{ imageRendering: 'pixelated', objectFit: 'contain' }} />
                </div>
                <div className="absolute -bottom-1 -right-2 bg-gray-800 border border-gray-600 rounded-full w-8 h-8 flex items-center justify-center text-sm">
                  {player.currentWeapon.type === 'ranged' ? '🔫' : '⚔'}
                </div>
              </div>
              {/* 捕获的狗 */}
              {combat.dogActive && (
                <div className={`relative ${combat.phase === 'player' ? 'hsr-float' : ''}`} style={{ animationDelay: '0.15s' }}>
                  <div className="w-14 h-14 md:w-18 md:h-18">
                    <div className="w-full h-full flex items-center justify-center text-4xl" style={{ filter: 'drop-shadow(0 0 8px rgba(180,130,70,0.5))' }}>
                      🐕
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-amber-900/80 border border-amber-600 rounded-full w-6 h-6 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-amber-300">{combat.dogDamage}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2 text-center">
              <p className="text-xs text-orange-400 font-bold" style={{ fontFamily: 'monospace' }}>航天员</p>
              <p className="text-[10px] text-gray-500">{player.currentWeapon.nameZh} (伤害{player.currentWeapon.damage})</p>
              {pet.active && <p className="text-[9px] text-blue-400">{pet.name} +{pet.bonusDamage}%</p>}
              {combat.dogActive && <p className="text-[9px] text-amber-400" style={{ fontFamily: 'monospace' }}>🐕 流浪狗 攻{combat.dogDamage} 连携{combat.dogPursuitDamage}</p>}
            </div>
          </div>

          {/* 中间信息 */}
          <div className="flex flex-col items-center gap-3">
            {combat.combo > 0 && (
              <div className="text-lg font-bold text-orange-400 animate-pulse" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.6rem' }}>
                {combat.combo}x 连击
              </div>
            )}
            <div className={`px-4 py-2 rounded-full text-xs font-bold ${
              combat.phase === 'player' ? 'bg-orange-600/40 text-orange-300 border border-orange-500/40' :
              combat.phase === 'enemy' && combat.dodgeActive ? 'bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 animate-pulse' :
              'bg-red-600/40 text-red-300 border border-red-500/40'
            }`} style={{ fontFamily: 'monospace' }}>
              {combat.phase === 'player' ? '你的回合' :
               combat.phase === 'enemy' && combat.dodgeActive ? '闪避 & 追击中...' :
               '敌方回合'}
            </div>
          </div>

          {/* 敌人 */}
          <div className={`relative flex flex-col items-center ${combat.phase === 'enemy' && !combat.dodgeActive ? 'hsr-enemy-glow' : ''}`}>
            <div className="relative">
              <div className={`w-28 h-28 md:w-36 md:h-36 ${combat.phase === 'enemy' && !combat.dodgeActive ? 'hsr-float' : ''}`}>
                <img src={spriteMap[enemy.type] || spriteMap.sand} alt={enemy.nameZh} className="w-full h-full" style={{ imageRendering: 'pixelated', objectFit: 'contain', filter: 'drop-shadow(0 0 15px rgba(142,68,173,0.4))' }} />
              </div>
            </div>
            <div className="mt-2 text-center">
              <p className="text-xs text-purple-300 font-bold" style={{ fontFamily: 'monospace' }}>{enemy.nameZh}</p>
              <p className="text-[10px] text-gray-500">{enemy.damageType === 'magic' ? '法术攻击' : '物理攻击'} | 伤害{enemy.damage}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 底部答题区域 */}
      <div className="relative z-20 pb-3 px-4">
        <div className="max-w-2xl mx-auto">
          <div className={`bg-gray-900/80 rounded-xl p-4 mb-3 transition-all duration-300 ${
            resultFlash === 'correct'
              ? 'border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4),inset_0_0_20px_rgba(34,197,94,0.1)]'
              : resultFlash === 'wrong'
              ? 'border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4),inset_0_0_20px_rgba(239,68,68,0.1)]'
              : 'border border-purple-500/30'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>选择正确答案进行攻击</span>
              <span className="text-xs text-gray-600 ml-2">|</span>
              <span className="text-xs text-orange-400 ml-2" style={{ fontFamily: 'monospace' }}>{player.currentWeapon.nameZh}</span>
            </div>
            <div className="text-center mb-3">
              <span className="text-xl md:text-2xl font-bold text-white tracking-wider leading-relaxed" style={{ fontFamily: 'monospace', textShadow: '0 0 20px rgba(142,68,173,0.5)' }}>
                {question.question || question.word}
              </span>
            </div>
            {/* 答题结果提示条 */}
            {resultFlash && (
              <div className={`text-center py-2 rounded-lg mb-1 ${
                resultFlash === 'correct' ? 'bg-green-900/40 border border-green-500/30' : 'bg-red-900/40 border border-red-500/30'
              }`}>
                <p className={`text-sm font-bold ${resultFlash === 'correct' ? 'text-green-400' : 'text-red-400'}`} style={{ fontFamily: 'monospace' }}>
                  {resultFlash === 'correct' ? `✓ 回答正确！${player.currentWeapon.nameZh}造成 ${player.currentWeapon.damage} 点伤害` : `✗ 回答错误！正确答案是：${question.options[question.correctIndex]}`}
                </p>
              </div>
            )}
          </div>

          {combat.phase === 'player' ? (
            <>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {question.options.map((option, i) => {
                  const isSelected = combat.selectedOption === i;
                  const isCorrect = i === question.correctIndex;
                  let btnClass = `${OPTION_BG[i]} border ${OPTION_BORDER[i]} `;
                  if (combat.answered) {
                    if (isCorrect) btnClass = 'bg-green-600 border-green-300 ';
                    else if (isSelected && !isCorrect) btnClass = 'bg-red-700 border-red-400 opacity-60 ';
                    else btnClass = 'bg-gray-800 border-gray-700 opacity-30 ';
                  }
                  return (
                    <button key={i} onClick={() => !combat.answered && onAnswer(i)} disabled={combat.answered}
                      className={`${btnClass}relative px-4 py-3.5 rounded-lg border-2 text-white font-bold text-sm transition-all ${!combat.answered ? 'hover:scale-[1.03] active:scale-[0.97] cursor-pointer' : 'cursor-default'}`}
                      style={{ fontFamily: 'monospace' }}>
                      <span className="absolute top-1 left-2 text-[10px] opacity-50 font-mono">[{i + 1}]</span>
                      <span>{option}</span>
                      {combat.answered && isCorrect && <span className="absolute top-1 right-2 text-green-300 text-lg">✓</span>}
                      {combat.answered && isSelected && !isCorrect && <span className="absolute top-1 right-2 text-red-300 text-lg">✗</span>}
                    </button>
                  );
                })}
              </div>
              <div className="w-full">
                <div className="flex items-center gap-2 mb-0.5">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="text-[10px] text-gray-500" style={{ fontFamily: 'monospace' }}>{combat.timeLeft.toFixed(1)}s</span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-100 ${timePercent > 50 ? 'bg-green-500' : timePercent > 25 ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} style={{ width: `${timePercent}%` }} />
                </div>
              </div>
              {!combat.answered && <p className="text-center text-[10px] text-gray-600 mt-2" style={{ fontFamily: 'monospace' }}>按 1-4 选择答案</p>}
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4">
              {combat.dodgeActive ? (
                <>
                  <div className="text-lg font-bold text-cyan-400 animate-pulse" style={{ fontFamily: 'monospace' }}>
                    <Shield className="w-5 h-5 inline mr-1" />闪避生效 + 自动追击
                  </div>
                  <div className="text-sm text-gray-400" style={{ fontFamily: 'monospace' }}>规避伤害并趁势反击...</div>
                </>
              ) : (
                <>
                  <div className="text-lg font-bold text-red-400 animate-pulse" style={{ fontFamily: 'monospace' }}>⚔ {enemy.nameZh} 攻击中...</div>
                  <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </>
              )}
            </div>
          )}

          {/* 闪避技能条 */}
          <div className="mt-3 px-2">
            <div className="flex items-center gap-2">
              <button onClick={() => { if (combat.dodgeReady && !combat.dodgeActive && !combat.dodgeUsed && combat.phase === 'player') { onActivateDodge(); }}}
                className={`relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${combat.dodgeActive ? 'border-green-400 animate-pulse' : combat.dodgeReady ? 'border-cyan-400 hover:scale-110 cursor-pointer' : 'border-gray-700 cursor-default'}`}
                title="闪避 [Q]">
                <div className="absolute inset-0 bg-gray-900" />
                <div className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ${combat.dodgeReady ? 'bg-cyan-400/70' : 'bg-gray-600/40'}`} style={{ height: `${combat.dodgeChargePercent}%` }} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Zap className={`w-5 h-5 ${combat.dodgeReady ? 'text-white' : 'text-gray-500'}`} />
                  <span className="text-[8px] font-bold text-gray-300 mt-0.5" style={{ fontFamily: 'monospace' }}>Q</span>
                </div>
                {combat.dodgeActive && <div className="absolute inset-0 border-2 border-green-400 rounded-lg animate-ping opacity-30" />}
              </button>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400" style={{ fontFamily: 'monospace' }}>技能：闪避</span>
                  <span className="text-[10px] font-bold" style={{ fontFamily: 'monospace', color: combat.dodgeActive ? '#4ade80' : combat.dodgeReady ? '#22d3ee' : '#6b7280' }}>
                    {combat.dodgeActive ? '已激活' : combat.dodgeReady ? '就绪！' : `充能 ${combat.dodgeChargePercent}%`}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mt-0.5">
                  <div className={`h-full rounded-full transition-all duration-500 ${combat.dodgeReady ? 'bg-cyan-400' : 'bg-gray-600'}`} style={{ width: `${combat.dodgeChargePercent}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
