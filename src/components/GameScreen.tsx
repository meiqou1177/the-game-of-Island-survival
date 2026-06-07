import React, { useEffect, useState, useRef } from 'react';
import {
  Heart, Droplets, Utensils, Zap, Crosshair, Package,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Map, Pause
} from 'lucide-react';
import type { MapRegion, PlayerState, WeatherState, PetState, GameLog } from '@/types/game';

interface GameScreenProps {
  currentMap: MapRegion;
  player: PlayerState;
  weather: WeatherState;
  pet: PetState;
  logs: GameLog[];
  isPaused: boolean;
  onMove: (dx: number, dy: number, sprint?: boolean) => void;
  onPause: () => void;
  onInventory: () => void;
  onOpenChest: (chestId: string) => void;
}

const TILE_SIZE = 40;
const VIEWPORT_W = 13;
const VIEWPORT_H = 11;
const PLAYER_SIZE = 72;

const MAP_TEXTURES: Record<string, string> = {
  beach: '/assets/tile_beach.jpg',
  jungle: '/assets/tile_jungle.jpg',
  swamp: '/assets/tile_swamp.jpg',
  cliff: '/assets/tile_cliff.jpg',
  valley: '/assets/tile_valley.jpg',
};

const TILE_COLORS: Record<string, string> = {
  ground: '#2d5016', wall: '#1a1a2e', water: '#1e3a5f',
  tree: '#1b4332', rock: '#4a4a4a', vine: '#2d5016', exit: '#f39c12',
};

function getTileStyle(type: string, mapType: string): React.CSSProperties {
  if (type === 'ground') {
    const texture = MAP_TEXTURES[mapType];
    if (texture) return { backgroundImage: `url(${texture})`, backgroundSize: '160px 160px', backgroundColor: '#2d5016' };
    switch (mapType) {
      case 'beach': return { backgroundColor: '#c9a84c' };
      case 'jungle': return { backgroundColor: '#2d5016' };
      case 'swamp': return { backgroundColor: '#3d5c3d' };
      case 'cliff': return { backgroundColor: '#6b6b6b' };
      case 'valley': return { backgroundColor: '#4a6741' };
      default: return { backgroundColor: '#2d5016' };
    }
  }
  if (type === 'water') return { backgroundColor: mapType === 'swamp' ? '#2d4a2d' : '#1e3a5f' };
  return { backgroundColor: TILE_COLORS[type] || '#2d5016' };
}

function TileDecoration({ type, variant }: { type: string; mapType: string; variant: number }) {
  if (type === 'tree') return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-7 h-6 rounded-full bg-green-800 border border-green-700/50" />
      <div className="absolute w-1.5 h-3 bg-amber-900/80 top-1/2" />
    </div>
  );
  if (type === 'rock') return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className={`rounded bg-gray-600 border border-gray-500/30 ${variant % 2 === 0 ? 'w-5 h-4' : 'w-4 h-5'}`} />
    </div>
  );
  if (type === 'water') return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-400/15" style={{ animation: 'wave 2s ease-in-out infinite' }} />
    </div>
  );
  if (type === 'wall') return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-0 left-0 right-0 h-px bg-gray-600/30" />
    </div>
  );
  if (type === 'food') return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <span className="text-base animate-pulse" style={{ filter: 'drop-shadow(0 0 3px rgba(230,126,34,0.6))' }}>{'🍎'}</span>
    </div>
  );
  if (type === 'water_source') return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <span className="text-base animate-pulse" style={{ filter: 'drop-shadow(0 0 3px rgba(52,152,219,0.6))' }}>{'💧'}</span>
    </div>
  );
  if (type === 'ammo_box') return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <span className="text-base animate-pulse" style={{ filter: 'drop-shadow(0 0 4px rgba(155,89,182,0.8))' }}>{'🧰'}</span>
    </div>
  );
  if (type === 'medkit_box') return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <span className="text-base animate-pulse" style={{ filter: 'drop-shadow(0 0 4px rgba(231,76,60,0.8))' }}>{'💊'}</span>
    </div>
  );
  if (type === 'material_box') return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <span className="text-base animate-pulse" style={{ filter: 'drop-shadow(0 0 4px rgba(46,204,113,0.8))' }}>{'📦'}</span>
    </div>
  );
  return null;
}

function getBarColor(value: number, max: number) {
  const r = value / max;
  if (r > 0.6) return '#2ECC71';
  if (r > 0.3) return '#E67E22';
  return '#E74C3C';
}

export function GameScreen({ currentMap, player, weather, pet, logs, isPaused, onMove, onPause, onInventory, onOpenChest }: GameScreenProps) {
  const [showMinimap, setShowMinimap] = useState(false);
  const [nearbyChest, setNearbyChest] = useState<string | null>(null);
  
  // ===== 行走动画状态 =====
  // walkFrame: 0=idle 1=walk1 2=walk2
  const [walkFrame, setWalkFrame] = useState(0);
  const [facingRight, setFacingRight] = useState(true);
  const prevPosRef = useRef(player.position);
  const walkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const walkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 视野计算
  const camX = Math.max(0, Math.min(currentMap.width - VIEWPORT_W, player.position.x - Math.floor(VIEWPORT_W / 2)));
  const camY = Math.max(0, Math.min(currentMap.height - VIEWPORT_H, player.position.y - Math.floor(VIEWPORT_H / 2)));

  // 检测移动并控制三帧动画
  useEffect(() => {
    const dx = player.position.x - prevPosRef.current.x;
    const dy = player.position.y - prevPosRef.current.y;
    const steps = Math.abs(dx) + Math.abs(dy);

    if (steps > 0) {
      // 方向（dx>0 向右，dx<0 向左翻转）
      if (dx !== 0) setFacingRight(dx > 0);
      prevPosRef.current = player.position;

      // 清除之前的定时器
      if (walkIntervalRef.current) { clearInterval(walkIntervalRef.current); walkIntervalRef.current = null; }
      if (walkTimeoutRef.current) { clearTimeout(walkTimeoutRef.current); walkTimeoutRef.current = null; }

      // 无论单步还是多步，都进入行走动画
      let frame = 1; // 从 walk1 开始
      setWalkFrame(frame);

      // 在 walk1 和 walk2 之间来回切换
      walkIntervalRef.current = setInterval(() => {
        frame = frame === 1 ? 2 : 1;
        setWalkFrame(frame);
      }, 250);

      // 停止行走回到idle（单步300ms，冲刺500ms）
      const idleDelay = steps === 1 ? 300 : 500;
      walkTimeoutRef.current = setTimeout(() => {
        if (walkIntervalRef.current) { clearInterval(walkIntervalRef.current); walkIntervalRef.current = null; }
        setWalkFrame(0); // 回到 idle
      }, idleDelay);
    }

    return () => {
      if (walkIntervalRef.current) { clearInterval(walkIntervalRef.current); walkIntervalRef.current = null; }
      if (walkTimeoutRef.current) { clearTimeout(walkTimeoutRef.current); walkTimeoutRef.current = null; }
    };
  }, [player.position]);

  // 检测附近宝箱
  useEffect(() => {
    const chest = currentMap.chests.find(c =>
      !c.opened && Math.abs(c.position.x - player.position.x) <= 1 && Math.abs(c.position.y - player.position.y) <= 1
    );
    setNearbyChest(chest ? chest.id : null);
  }, [player.position, currentMap.chests]);

  // 键盘输入
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) return;
      const sprint = e.shiftKey;
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': onMove(0, -1, sprint); break;
        case 's': case 'arrowdown': onMove(0, 1, sprint); break;
        case 'a': case 'arrowleft': onMove(-1, 0, sprint); break;
        case 'd': case 'arrowright': onMove(1, 0, sprint); break;
        case 'f': if (nearbyChest) onOpenChest(nearbyChest); break;
        case 'escape': onPause(); break;
        case 'i': onInventory(); break;
        case 'm': setShowMinimap(p => !p); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onMove, onPause, onInventory, onOpenChest, nearbyChest, isPaused]);

  // 渲染瓦片
  const renderTiles = () => {
    const tiles: React.ReactElement[] = [];
    for (let vy = 0; vy < VIEWPORT_H; vy++) {
      for (let vx = 0; vx < VIEWPORT_W; vx++) {
        const mx = camX + vx, my = camY + vy;
        if (mx < 0 || mx >= currentMap.width || my < 0 || my >= currentMap.height) {
          tiles.push(<div key={`${vx}-${vy}`} className="absolute" style={{ left: vx * TILE_SIZE, top: vy * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, backgroundColor: '#0a0a1a' }} />);
          continue;
        }
        const tile = currentMap.tiles[my][mx];
        const dist = Math.abs(mx - player.position.x) + Math.abs(my - player.position.y);
        const inVision = !currentMap.visionRange || dist <= currentMap.visionRange / 2;
        const isExit = Math.abs(currentMap.exitPosition.x - mx) <= 1 && Math.abs(currentMap.exitPosition.y - my) <= 1;
        const allDefeated = currentMap.squads.every(s => s.defeated);

        tiles.push(
          <div
            key={`${vx}-${vy}`}
            className="absolute overflow-hidden"
            style={{ left: vx * TILE_SIZE, top: vy * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, opacity: inVision ? 1 : 0.1, ...getTileStyle(tile.type, currentMap.type) }}
          >
            {inVision && <TileDecoration type={tile.type} mapType={currentMap.type} variant={tile.variant} />}
            {isExit && allDefeated && inVision && (
              <div className="absolute inset-0 flex items-center justify-center animate-pulse pointer-events-none">
                <span className="text-yellow-400 font-bold text-[10px]" style={{ fontFamily: 'monospace' }}>出口</span>
              </div>
            )}
          </div>
        );
      }
    }
    return tiles;
  };

  // 渲染敌人
  const renderEnemies = () => currentMap.squads.filter(s => !s.defeated).map(squad => {
    const sx = squad.position.x - camX;
    const sy = squad.position.y - camY;
    if (sx < -1 || sx >= VIEWPORT_W + 1 || sy < -1 || sy >= VIEWPORT_H + 1) return null;
    const dist = Math.abs(squad.position.x - player.position.x) + Math.abs(squad.position.y - player.position.y);
    const inVision = !currentMap.visionRange || dist <= currentMap.visionRange;
    const enemy = squad.enemies[0];
    const spriteMap: Record<string, string> = { sand: '/assets/enemy_sand.png', wood: '/assets/enemy_wood.png', stone: '/assets/enemy_stone.png', fly: '/assets/enemy_fly.png', boss: '/assets/enemy_boss.png' };
    const ENEMY_SIZE = 56;
    const off = (ENEMY_SIZE - TILE_SIZE) / 2;
    return (
      <div key={squad.id} className={`absolute transition-all duration-300 ${inVision ? 'opacity-100' : 'opacity-0'}`}
        style={{ left: sx * TILE_SIZE - off, top: sy * TILE_SIZE - off, width: ENEMY_SIZE, height: ENEMY_SIZE, filter: inVision ? 'drop-shadow(0 2px 4px rgba(142,68,173,0.4))' : 'brightness(0.2)' }}>
        <img src={spriteMap[enemy.type] || spriteMap.sand} alt={enemy.nameZh} className="w-full h-full" style={{ imageRendering: 'pixelated', objectFit: 'contain' }} />
        {squad.enemies.length > 1 && (
          <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{squad.enemies.length}</div>
        )}
      </div>
    );
  });

  // 渲染宝箱
  const renderChests = () => currentMap.chests.filter(c => !c.opened).map(chest => {
    const cx = chest.position.x - camX, cy = chest.position.y - camY;
    if (cx < 0 || cx >= VIEWPORT_W || cy < 0 || cy >= VIEWPORT_H) return null;
    const dist = Math.abs(chest.position.x - player.position.x) + Math.abs(chest.position.y - player.position.y);
    const inVision = !currentMap.visionRange || dist <= currentMap.visionRange;
    return (
      <div key={chest.id} className={`absolute transition-opacity duration-300 ${inVision ? 'opacity-100' : 'opacity-0'}`}
        style={{ left: cx * TILE_SIZE, top: cy * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}>
        <img src="/assets/chest.png" alt="宝箱" className="w-full h-full" style={{ imageRendering: 'pixelated', objectFit: 'contain' }} />
      </div>
    );
  });

  // 渲染狗
  const renderDog = () => currentMap.creatures.filter(c => c.type === 'dog' && !c.captured).map(dog => {
    const dx = dog.position.x - camX, dy = dog.position.y - camY;
    if (dx < 0 || dx >= VIEWPORT_W || dy < 0 || dy >= VIEWPORT_H) return null;
    const dist = Math.abs(dog.position.x - player.position.x) + Math.abs(dog.position.y - player.position.y);
    const inVision = !currentMap.visionRange || dist <= currentMap.visionRange;
    const DOG_SIZE = 40;
    const off = (DOG_SIZE - TILE_SIZE) / 2;
    return (
      <div key={dog.id} className={`absolute transition-all duration-300 ${inVision ? 'opacity-100' : 'opacity-0'}`}
        style={{ left: dx * TILE_SIZE - off, top: dy * TILE_SIZE - off, width: DOG_SIZE, height: DOG_SIZE, filter: inVision ? 'drop-shadow(0 2px 4px rgba(180,130,70,0.5))' : 'brightness(0.2)' }}>
        <div className="w-full h-full flex items-center justify-center text-3xl" style={{ filter: 'drop-shadow(0 0 6px rgba(180,130,70,0.6))' }}>
          🐕
        </div>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-800/80 border border-amber-600 rounded px-1 text-[7px] text-amber-300 whitespace-nowrap" style={{ fontFamily: 'monospace' }}>
          流浪狗
        </div>
      </div>
    );
  });

  // 检测是否在狗3×3范围内
  const nearDog = currentMap.creatures.find(c =>
    c.type === 'dog' && !c.captured &&
    Math.abs(c.position.x - player.position.x) <= 1 &&
    Math.abs(c.position.y - player.position.y) <= 1
  );

  // 渲染战争迷雾
  const renderFog = () => {
    if (!currentMap.visionRange) return null;
    const fogTiles: React.ReactElement[] = [];
    for (let fy = 0; fy < VIEWPORT_H; fy++) {
      for (let fx = 0; fx < VIEWPORT_W; fx++) {
        const mx = camX + fx, my = camY + fy;
        const dist = Math.sqrt(Math.pow(mx - player.position.x, 2) + Math.pow(my - player.position.y, 2));
        const opacity = dist > (currentMap.visionRange ?? 0) / 2 ? Math.min(1, (dist - (currentMap.visionRange ?? 0) / 2) / 3) : 0;
        if (opacity > 0) {
          fogTiles.push(<div key={`fog-${fx}-${fy}`} className="absolute bg-black pointer-events-none" style={{ left: fx * TILE_SIZE, top: fy * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, opacity }} />);
        }
      }
    }
    return <div className="absolute inset-0 pointer-events-none z-15">{fogTiles}</div>;
  };

  return (
    <div className="relative w-full h-screen bg-[#1a1a2e] overflow-hidden select-none">
      <div className="flex h-full">
        {/* 地图区 */}
        <div className="flex-1 relative flex items-center justify-center bg-black">
          <div className="relative overflow-hidden rounded-lg border-2 border-gray-700" style={{ width: VIEWPORT_W * TILE_SIZE, height: VIEWPORT_H * TILE_SIZE }}>
            {/* 天气 */}
            {weather.current === 'rain' && <div className="absolute inset-0 pointer-events-none z-20 bg-blue-900/20" />}
            {weather.current === 'fog' && <div className="absolute inset-0 bg-gray-400/20 pointer-events-none z-20" />}
            
            {renderTiles()}
            {renderChests()}
            {renderDog()}
            {renderEnemies()}
            
            {/* 玩家角色 - 三张独立图片切换 */}
            <div
              className="absolute z-10"
              style={{
                left: (player.position.x - camX) * TILE_SIZE - (PLAYER_SIZE - TILE_SIZE) / 2,
                top: (player.position.y - camY) * TILE_SIZE - (PLAYER_SIZE - TILE_SIZE) / 2,
                width: PLAYER_SIZE,
                height: PLAYER_SIZE,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
              }}
            >
              <div className={`w-full h-full ${facingRight ? 'face-right' : 'face-left'}`}>
                <img
                  src={walkFrame === 0 ? '/assets/player_idle.png' : walkFrame === 1 ? '/assets/player_walk1.png' : '/assets/player_walk2.png'}
                  alt="玩家"
                  className="w-full h-full"
                  style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
                />
              </div>
            </div>
            
            {renderFog()}
          </div>
        </div>

        {/* 右侧面板 */}
        <div className="w-64 bg-gray-900/95 border-l border-gray-700 flex flex-col">
          {/* 地图名+天数 */}
          <div className="p-3 border-b border-gray-700 flex justify-between">
            <span className="text-gray-400 text-xs font-bold" style={{ fontFamily: 'monospace' }}>{currentMap.nameZh}</span>
            <span className="text-yellow-400 text-xs" style={{ fontFamily: 'monospace' }}>第 {player.daysSurvived} 天</span>
          </div>
          
          {/* 状态条 */}
          <div className="p-3 space-y-2 border-b border-gray-700">
            {[
              { icon: Heart, color: '#E74C3C', bg: 'bg-red-500', val: player.hp, max: player.maxHp },
              { icon: Utensils, color: '#E67E22', bg: 'bg-orange-500', val: player.hunger, max: player.maxHunger },
              { icon: Droplets, color: '#3498DB', bg: 'bg-blue-500', val: player.water, max: player.maxWater },
              { icon: Zap, color: '#F1C40F', bg: 'bg-yellow-500', val: player.stamina, max: player.maxStamina },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <s.icon className="w-4 h-4 flex-shrink-0" style={{ color: s.color }} />
                <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full ${s.bg} rounded-full transition-all duration-300`} style={{ width: `${(s.val / s.max) * 100}%`, backgroundColor: getBarColor(s.val, s.max) }} />
                </div>
                <span className="text-xs text-gray-300 w-10 text-right" style={{ fontFamily: 'monospace' }}>{Math.floor(s.val)}</span>
              </div>
            ))}
            
            {/* 弹药 */}
            <div className="flex items-center gap-2">
              <Crosshair className={`w-4 h-4 flex-shrink-0 ${player.ammo > 10 ? 'text-blue-400' : player.ammo > 0 ? 'text-yellow-400' : 'text-red-500'}`} />
              <span className={`text-xs font-bold ${player.ammo > 10 ? 'text-blue-300' : player.ammo > 0 ? 'text-yellow-300' : 'text-red-400'}`} style={{ fontFamily: 'monospace' }}>
                {player.ammo === 0 ? '弹药耗尽' : `弹药: ${player.ammo}`}
              </span>
            </div>
            
            <div className="text-xs text-gray-500" style={{ fontFamily: 'monospace' }}>
              天气: {weather.current === 'clear' ? '晴朗' : weather.current === 'rain' ? '暴雨' : '酷暑'}
            </div>
          </div>

          {/* 武器 */}
          <div className="p-3 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-lg">{player.currentWeapon.type === 'ranged' ? '\u{1F52B}' : '\u{2694}'}</span>
              <div>
                <p className="text-xs text-white" style={{ fontFamily: 'monospace' }}>{player.currentWeapon.nameZh}</p>
                <p className="text-[10px] text-gray-500">伤害:{player.currentWeapon.damage} {player.currentWeapon.type === 'ranged' ? `| 弹药:${player.ammo}` : '| 近战'}</p>
              </div>
            </div>
          </div>

          {/* 宠物 */}
          {pet.active && (
            <div className="p-3 border-b border-gray-700 flex items-center gap-2">
              <img src="/assets/pet_robotdog.png" alt="宠物" className="w-7 h-7" style={{ imageRendering: 'pixelated', objectFit: 'contain' }} />
              <div>
                <p className="text-xs text-blue-400" style={{ fontFamily: 'monospace' }}>{pet.name} Lv.{pet.level}</p>
                <p className="text-[10px] text-gray-500">+{pet.bonusDamage}%伤害 +{pet.bonusDefense}%防御</p>
              </div>
            </div>
          )}

          {/* 日志 */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-2 text-xs text-gray-500 border-b border-gray-700" style={{ fontFamily: 'monospace' }}>日志</div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {logs.slice(0, 20).map((log, i) => (
                <p key={i} className={`text-[10px] leading-tight ${log.type === 'danger' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : log.type === 'combat' ? 'text-orange-400' : log.type === 'loot' ? 'text-yellow-400' : log.type === 'warning' ? 'text-orange-300' : 'text-gray-400'}`} style={{ fontFamily: 'monospace' }}>{log.message}</p>
              ))}
            </div>
          </div>

          {/* 快捷栏 */}
          <div className="p-2 border-t border-gray-700 grid grid-cols-4 gap-1 text-[10px]">
            <button onClick={onPause} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 transition-colors flex flex-col items-center gap-0.5"><Pause className="w-3 h-3" /><span>ESC</span></button>
            <button onClick={onInventory} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 transition-colors flex flex-col items-center gap-0.5"><Package className="w-3 h-3" /><span>背包</span></button>
            <button onClick={() => setShowMinimap(p => !p)} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 transition-colors flex flex-col items-center gap-0.5"><Map className="w-3 h-3" /><span>地图</span></button>
            <div className="p-1.5 bg-gray-800/50 rounded text-gray-500 flex flex-col items-center gap-0.5"><span className="font-bold">SHIFT</span><span>冲刺</span></div>
          </div>
        </div>
      </div>

      {/* 虚拟摇杆 */}
      <div className="absolute bottom-4 left-4 md:hidden">
        <div className="relative w-32 h-32">
          <button onPointerDown={() => onMove(0, -1)} className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 bg-gray-800/80 rounded-lg flex items-center justify-center text-white active:bg-gray-600"><ChevronUp className="w-6 h-6" /></button>
          <button onPointerDown={() => onMove(0, 1)} className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 bg-gray-800/80 rounded-lg flex items-center justify-center text-white active:bg-gray-600"><ChevronDown className="w-6 h-6" /></button>
          <button onPointerDown={() => onMove(-1, 0)} className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-800/80 rounded-lg flex items-center justify-center text-white active:bg-gray-600"><ChevronLeft className="w-6 h-6" /></button>
          <button onPointerDown={() => onMove(1, 0)} className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-800/80 rounded-lg flex items-center justify-center text-white active:bg-gray-600"><ChevronRight className="w-6 h-6" /></button>
          <button onPointerDown={() => onMove(0, 0, true)} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-orange-600/80 rounded-full flex items-center justify-center text-white text-xs active:bg-orange-500">冲</button>
        </div>
      </div>

      {/* 宝箱提示 */}
      {nearbyChest && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-600/90 text-white px-4 py-2 rounded-lg text-sm animate-bounce" style={{ fontFamily: 'monospace' }}>按 F 打开宝箱</div>}

      {/* 捕获狗提示 */}
      {nearDog && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-600/90 text-white px-4 py-2 rounded-lg text-sm animate-pulse" style={{ fontFamily: 'monospace' }}>
          🐕 发现流浪狗！按 E 捕获（需生物捕获装置）
        </div>
      )}

      {/* 小地图 */}
      {showMinimap && (
        <div className="absolute top-16 right-72 bg-black/90 border border-gray-600 rounded-lg p-2 z-30">
          <div className="text-xs text-gray-400 mb-1" style={{ fontFamily: 'monospace' }}>小地图</div>
          <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${currentMap.width}, 3px)` }}>
            {currentMap.tiles.flat().map((tile, i) => {
              const x = i % currentMap.width, y = Math.floor(i / currentMap.width);
              const isPlayer = x === player.position.x && y === player.position.y;
              const isEnemy = currentMap.squads.some(s => !s.defeated && s.position.x === x && s.position.y === y);
              const isDog = currentMap.creatures.some(c => c.type === 'dog' && !c.captured && c.position.x === x && c.position.y === y);
              const isSpecial = tile.type === 'ammo_box' ? '#9b59b6' : tile.type === 'medkit_box' ? '#e74c3c' : tile.type === 'material_box' ? '#2ecc71' : null;
              return <div key={i} className="w-[3px] h-[3px]" style={{ backgroundColor: isPlayer ? '#E67E22' : isDog ? '#D4A054' : isEnemy ? '#E74C3C' : isSpecial || (tile.type === 'wall' ? '#333' : tile.type === 'tree' ? '#1b4332' : '#555') }} />;
            })}
          </div>
          <button onClick={() => setShowMinimap(false)} className="mt-1 text-xs text-gray-500 hover:text-gray-300">关闭</button>
        </div>
      )}

      {/* 暂停遮罩 */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/70 z-40 flex items-center justify-center">
          <div className="bg-gray-900 border border-gray-600 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: '"Press Start 2P", monospace' }}>暂停</h2>
            <div className="flex flex-col gap-3">
              <button onClick={onPause} className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold transition-colors" style={{ fontFamily: 'monospace' }}>继续</button>
              <button onClick={onInventory} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-colors" style={{ fontFamily: 'monospace' }}>背包 (I)</button>
              <button onClick={() => window.location.reload()} className="px-6 py-3 bg-red-800 hover:bg-red-700 text-white rounded-lg font-bold transition-colors" style={{ fontFamily: 'monospace' }}>退出</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
