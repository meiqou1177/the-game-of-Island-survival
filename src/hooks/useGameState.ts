import { useState, useCallback } from 'react';
import type { GameState, Player, GameScreen, MapRegion, Combat, Enemy, Item, MapCreature, Weapon, Armor, LeaderboardEntry, Question } from '@/types/game';
import { createAllMaps } from '@/data/maps';
import { createEnemy } from '@/data/enemies';

const createInitialPlayer = (): Player => ({
  id: `player_${Date.now()}`,
  name: 'Astronaut',
  level: 1,
  exp: 0,
  expToNextLevel: 100,
  hp: 100,
  maxHp: 100,
  hunger: 100,
  maxHunger: 100,
  thirst: 100,
  maxThirst: 100,
  position: { x: 2, y: 2 },
  weapon: {
    id: 'fist',
    name: 'Fist',
    nameZh: '拳头',
    damage: 5,
    damageType: 'physical',
  },
  armor: null,
  inventory: [],
  maxInventory: 20,
  score: 0,
});

const createInitialState = (difficulty: 'easy' | 'normal' | 'hard'): GameState => ({
  screen: 'main_menu',
  player: createInitialPlayer(),
  currentMap: null,
  maps: createAllMaps(difficulty),
  combat: null,
  pet: null,
  logs: ['游戏开始。', '欢迎来到词汇生存岛！'],
  isPaused: false,
  weather: 'sunny',
  settings: {
    difficulty,
    volume: 100,
    quality: 'high',
  },
  leaderboard: [],
  currentQuestion: null,
});

export function useGameState() {
  const [state, setState] = useState<GameState>(createInitialState('normal'));

  // ===== 屏幕管理 =====
  const setScreen = useCallback((screen: GameScreen) => {
    setState(prev => ({ ...prev, screen }));
  }, []);

  const goBack = useCallback(() => {
    setState(prev => {
      switch (prev.screen) {
        case 'difficulty_select':
          return { ...prev, screen: 'main_menu' };
        case 'inventory':
        case 'exploration':
          return { ...prev, screen: 'main_menu' };
        case 'leaderboard':
          return { ...prev, screen: 'main_menu' };
        default:
          return prev;
      }
    });
  }, []);

  // ===== 游戏开始 =====
  const startGame = useCallback((difficulty: 'easy' | 'normal' | 'hard') => {
    const newState = createInitialState(difficulty);
    const firstMap = newState.maps[0];
    setState({
      ...newState,
      screen: 'exploration',
      currentMap: firstMap,
      player: {
        ...newState.player,
        position: { x: 2, y: 2 },
      },
    });
  }, []);

  // ===== 玩家移动 =====
  const movePlayer = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    setState(prev => {
      if (!prev.currentMap || prev.screen !== 'exploration') return prev;

      const newPos = { ...prev.player.position };
      const step = 1;

      switch (direction) {
        case 'up':
          newPos.y = Math.max(0, newPos.y - step);
          break;
        case 'down':
          newPos.y = Math.min(prev.currentMap.height - 1, newPos.y + step);
          break;
        case 'left':
          newPos.x = Math.max(0, newPos.x - step);
          break;
        case 'right':
          newPos.x = Math.min(prev.currentMap.width - 1, newPos.x + step);
          break;
      }

      return {
        ...prev,
        player: { ...prev.player, position: newPos },
      };
    });
  }, []);

  // ===== 答题系统 =====
  const answerQuestion = useCallback((answer: string, correct: boolean) => {
    setState(prev => {
      const baseExp = 10;
      const expGain = correct ? baseExp * (state.settings.difficulty === 'hard' ? 1.5 : 1) : 0;
      const newExp = prev.player.exp + expGain;
      const levelUp = newExp >= prev.player.expToNextLevel;

      return {
        ...prev,
        player: {
          ...prev.player,
          exp: levelUp ? 0 : newExp,
          level: levelUp ? prev.player.level + 1 : prev.player.level,
          expToNextLevel: levelUp ? prev.player.expToNextLevel + 50 : prev.player.expToNextLevel,
          score: prev.player.score + (correct ? 50 : 0),
        },
        currentQuestion: null,
      };
    });
  }, [state.settings.difficulty]);

  // ===== 战斗系统 =====
  const switchWeapon = useCallback((weaponId: string) => {
    setState(prev => {
      const weapon = prev.player.inventory.find(item => item.id === weaponId);
      if (!weapon) return prev;

      return {
        ...prev,
        player: {
          ...prev.player,
          weapon: weapon as any,
        },
      };
    });
  }, []);

  const useItem = useCallback((itemId: string) => {
    setState(prev => {
      const item = prev.player.inventory.find(i => i.id === itemId);
      if (!item) return prev;

      let newPlayer = { ...prev.player };

      if (item.type === 'food') {
        newPlayer.hunger = Math.min(newPlayer.maxHunger, newPlayer.hunger + 30);
      } else if (item.type === 'water') {
        newPlayer.thirst = Math.min(newPlayer.maxThirst, newPlayer.thirst + 30);
      } else if (item.type === 'medicine') {
        newPlayer.hp = Math.min(newPlayer.maxHp, newPlayer.hp + 25);
      }

      newPlayer.inventory = newPlayer.inventory.filter(i => i.id !== itemId);

      return { ...prev, player: newPlayer };
    });
  }, []);

  const activateDodge = useCallback(() => {
    setState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        dodge: true,
        dodgeCounter: 1,
      },
    }));
  }, []);

  // ===== 宝箱系统 =====
  const openChest = useCallback((chestId: string) => {
    setState(prev => {
      if (!prev.currentMap) return prev;

      const chest = prev.currentMap.chests.find(c => c.id === chestId);
      if (!chest || chest.opened) return prev;

      const newMap = { ...prev.currentMap };
      const chestIndex = newMap.chests.indexOf(chest);
      newMap.chests[chestIndex] = { ...chest, opened: true };

      return {
        ...prev,
        currentMap: newMap,
        player: {
          ...prev.player,
          inventory: [...prev.player.inventory, ...chest.items],
          score: prev.player.score + 100,
        },
        logs: [...prev.logs, `打开宝箱，获得物品！`],
      };
    });
  }, []);

  // ===== 装备系统 =====
  const equipArmor = useCallback((armorId: string) => {
    setState(prev => {
      const armor = prev.player.inventory.find(item => item.id === armorId);
      if (!armor) return prev;

      return {
        ...prev,
        player: {
          ...prev.player,
          armor: armor as any,
        },
      };
    });
  }, []);

  // ===== 制作系统 =====
  const craft = useCallback((recipeId: string) => {
    setState(prev => ({
      ...prev,
      logs: [...prev.logs, '制作系统正在开发中...'],
    }));
  }, []);

  // ===== 暂停系统 =====
  const togglePause = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  }, []);

  // ===== 战斗回合 =====
  const enemyTurn = useCallback(() => {
    setState(prev => {
      if (!prev.combat) return prev;

      const damage = Math.floor(Math.random() * 10) + 5;
      const newPlayer = {
        ...prev.player,
        hp: Math.max(0, prev.player.hp - damage),
      };

      if (newPlayer.hp <= 0) {
        return {
          ...prev,
          screen: 'game_over',
          player: newPlayer,
        };
      }

      return { ...prev, player: newPlayer, combat: { ...prev.combat, playerTurn: true } };
    });
  }, []);

  // ===== 捕获宠物 =====
  const captureDog = useCallback(() => {
    setState(prev => {
      if (!prev.currentMap || prev.pet) return prev;

      const dog = prev.currentMap.creatures.find(c => c.type === 'dog');
      if (!dog) return prev;

      const capturedDog = { ...dog, captured: true };
      const newMap = {
        ...prev.currentMap,
        creatures: prev.currentMap.creatures.map(c =>
          c.id === dog.id ? capturedDog : c
        ),
      };

      return {
        ...prev,
        pet: capturedDog,
        currentMap: newMap,
        logs: [...prev.logs, '成功捕获流浪狗！'],
      };
    });
  }, []);

  // ===== 排行榜 =====
  const saveToLeaderboard = useCallback((playerName: string) => {
    setState(prev => {
      const entry: LeaderboardEntry = {
        id: `entry_${Date.now()}`,
        playerName,
        score: prev.player.score,
        difficulty: prev.settings.difficulty,
        mapReached: prev.currentMap?.nameZh || '沙滩',
        timestamp: Date.now(),
      };

      return {
        ...prev,
        leaderboard: [entry, ...prev.leaderboard].slice(0, 10),
        screen: 'leaderboard',
      };
    });
  }, []);

  // ===== 游戏重置 =====
  const resetGame = useCallback(() => {
    setState(createInitialState('normal'));
  }, []);

  return {
    state,
    startGame,
    movePlayer,
    answerQuestion,
    switchWeapon,
    useItem,
    openChest,
    togglePause,
    setScreen,
    goBack,
    saveToLeaderboard,
    resetGame,
    craft,
    equipArmor,
    activateDodge,
    enemyTurn,
    captureDog,
  };
}
