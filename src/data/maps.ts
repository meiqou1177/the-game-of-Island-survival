import type { MapRegion, MapTile, MapType, TileType, Chest, Item, MapCreature } from '@/types/game';
import { createSquads } from './enemies';

/** 带种子的伪随机数生成器（确保地图每次生成结果固定） */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /** 返回 [0, 1) 之间的伪随机数 */
  next(): number {
    // 线性同余生成器 (LCG)
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  /** 返回 [min, max) 之间的整数 */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }
}

/** 每种地图类型的固定生成种子 */
const MAP_SEEDS: Record<MapType, number> = {
  beach: 42,
  jungle: 137,
  swamp: 2024,
  cliff: 77,
  valley: 99,
};

// 生成地图瓦片
function generateTiles(mapType: MapType): MapTile[][] {
  const rng = new SeededRandom(MAP_SEEDS[mapType]);
  const tiles: MapTile[][] = [];

  // 沼泽地图右下角出口3x3安全区（消除阻挡）
  const isSwampExitZone = (mx: number, my: number) =>
    mapType === 'swamp' && mx >= 26 && mx <= 28 && my >= 26 && my <= 28;

  for (let y = 0; y < 30; y++) {
    const row: MapTile[] = [];
    for (let x = 0; x < 30; x++) {
      let type: MapTile['type'] = 'ground';
      let variant = rng.nextInt(0, 4);

      // 入口安全区 (玩家起始位置 (2,2) 周围 5x5 区域)
      const isSpawnZone = x >= 1 && x <= 5 && y >= 1 && y <= 5;

      // 边界墙
      if (x === 0 || x === 29 || y === 0 || y === 29) {
        type = 'wall';
        variant = 0;
      } else if (isSwampExitZone(x, y)) {
        // 沼泽右下角3x3出口区域：强制空地，确保通行
        type = 'ground';
        variant = rng.nextInt(0, 4);
      } else if (isSpawnZone) {
        // 入口区域保证空地，放一点初始食物和水
        if (x === 2 && y === 3) { type = 'food'; variant = 0; }
        else if (x === 3 && y === 2) { type = 'water_source'; variant = 0; }
        else { type = 'ground'; variant = rng.nextInt(0, 4); }
      } else {
        switch (mapType) {
          case 'beach': {
            // 沙滩：开阔，少量返回舱残骸，较多椰子（食物）
            if ((x === 8 && y === 8) || (x === 9 && y === 8) || (x === 8 && y === 9)) {
              type = 'rock'; // 返回舱残骸
              variant = 2;
            } else if (rng.next() < 0.03) {
              type = 'rock';
              variant = rng.nextInt(0, 2);
            } else if (rng.next() < 0.015) {
              type = 'food'; // 椰子/野果
              variant = rng.nextInt(0, 3);
            } else if (rng.next() < 0.012) {
              type = 'water_source'; // 小水坑/椰子水
              variant = rng.nextInt(0, 2);
            }
            break;
          }
          case 'jungle': {
            // 丛林：中等密度树木，果实丰富
            if (rng.next() < 0.14) {
              type = 'tree';
              variant = rng.nextInt(0, 3);
            } else if (rng.next() < 0.012) {
              type = 'food'; // 野果/香蕉
              variant = rng.nextInt(0, 3);
            } else if (rng.next() < 0.01) {
              type = 'water_source'; // 溪流/露水
              variant = rng.nextInt(0, 2);
            }
            break;
          }
          case 'swamp': {
            // 沼泽：水池和毒池，有有毒蘑菇（不可食用）和净水植物
            if (rng.next() < 0.18) {
              type = 'water';
              variant = rng.nextInt(0, 2);
            } else if (rng.next() < 0.12) {
              type = 'tree'; // 枯树
              variant = 3;
            } else if (rng.next() < 0.008) {
              type = 'food'; // 可食用根茎
              variant = rng.nextInt(0, 2);
            } else if (rng.next() < 0.01) {
              type = 'water_source'; // 沼泽净水
              variant = 0;
            }
            break;
          }
          case 'cliff': {
            // 岩壁：大量岩石和阶梯，少量山泉
            if (rng.next() < 0.22) {
              type = 'rock';
              variant = rng.nextInt(0, 3);
            } else if ((x === 10 || x === 20) && y > 5 && y < 25) {
              type = 'vine'; // 藤蔓/阶梯
              variant = 0;
            } else if (rng.next() < 0.008) {
              type = 'food'; // 岩壁苔藓/地衣
              variant = 0;
            } else if (rng.next() < 0.01) {
              type = 'water_source'; // 山泉
              variant = 0;
            }
            break;
          }
          case 'valley': {
            // 山谷：封闭竞技场，Boss战前最后的补给
            if (rng.next() < 0.1) {
              type = 'rock';
              variant = rng.nextInt(0, 2);
            } else if (rng.next() < 0.015) {
              type = 'food'; // 应急食品
              variant = rng.nextInt(0, 2);
            } else if (rng.next() < 0.01) {
              type = 'water_source'; // 泉水
              variant = 0;
            }
            break;
          }
        }
      }

      row.push({ type, x, y, variant });
    }
    tiles.push(row);
  }

  return tiles;
}

// 放置特殊物品（每种全图1个）
function placeSpecialItems(tiles: MapTile[][], mapType: MapType): MapTile[][] {
  const rng = new SeededRandom(MAP_SEEDS[mapType] + 1000); // 使用不同的种子偏移
  const newTiles = tiles.map(row => row.map(t => ({ ...t })));
  const width = newTiles[0].length;
  const height = newTiles.length;

  // 特殊物品类型列表
  const specialTypes: TileType[] = ['ammo_box', 'medkit_box', 'material_box'];

  for (const spType of specialTypes) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 200) {
      const px = rng.nextInt(1, width - 1);
      const py = rng.nextInt(1, height - 1);

      // 确保位置是空地，不在入口安全区，不在出口附近
      const tile = newTiles[py]?.[px];
      const isSpawnZone = px >= 1 && px <= 5 && py >= 1 && py <= 5;
      const isExitZone = Math.abs(px - 28) <= 2 && Math.abs(py - 28) <= 2;

      if (tile && tile.type === 'ground' && !isSpawnZone && !isExitZone) {
        newTiles[py][px] = { ...tile, type: spType, variant: 0 };
        placed = true;
      }
      attempts++;
    }
  }

  return newTiles;
}

// 生成地图生物
function generateCreatures(mapType: MapType): MapCreature[] {
  const creatures: MapCreature[] = [];

  if (mapType === 'beach') {
    // 沙滩固定位置刷新一只狗
    creatures.push({
      id: 'beach_dog_01',
      type: 'dog',
      name: 'Stray Dog',
      nameZh: '流浪狗',
      position: { x: 12, y: 12 },
      captured: false,
      damage: 5,
      pursuitDamage: 5,
    });
  }

  return creatures;
}

// 生成宝箱
function generateChests(mapType: MapType): Chest[] {
  const chests: Chest[] = [];
  
  switch (mapType) {
    case 'beach': {
      // 沙滩：2个宝箱
      chests.push({
        id: 'beach_chest_0',
        position: { x: 15, y: 5 },
        opened: false,
        items: generateChestLoot('beach'),
      });
      chests.push({
        id: 'beach_chest_1',
        position: { x: 25, y: 25 },
        opened: false,
        items: generateChestLoot('beach'),
      });
      break;
    }
    case 'jungle': {
      // 丛林：击杀小队后刷新2个宝箱
      chests.push({
        id: 'jungle_chest_0',
        position: { x: 15, y: 10 },
        opened: false,
        items: generateChestLoot('jungle'),
      });
      chests.push({
        id: 'jungle_chest_1',
        position: { x: 8, y: 18 },
        opened: false,
        items: generateChestLoot('jungle'),
      });
      break;
    }
    case 'swamp': {
      // 沼泽：3个宝箱
      chests.push({
        id: 'swamp_chest_0',
        position: { x: 15, y: 15 },
        opened: false,
        items: generateChestLoot('swamp'),
      });
      chests.push({
        id: 'swamp_chest_1',
        position: { x: 5, y: 15 },
        opened: false,
        items: generateChestLoot('swamp'),
      });
      chests.push({
        id: 'swamp_chest_2',
        position: { x: 25, y: 15 },
        opened: false,
        items: generateChestLoot('swamp'),
      });
      break;
    }
    case 'cliff': {
      // 岩壁：1个宝箱
      chests.push({
        id: 'cliff_chest_0',
        position: { x: 15, y: 10 },
        opened: false,
        items: generateChestLoot('cliff'),
      });
      break;
    }
    case 'valley': {
      // 山谷：无宝箱
      break;
    }
  }
  
  return chests;
}

// 生成宝箱内容
function generateChestLoot(mapType: string): Item[] {
  const items: Item[] = [];
  
  // 食物
  items.push({
    id: `chest_food_${Date.now()}`,
    name: 'Canned Food',
    nameZh: '罐头食品',
    quantity: Math.floor(Math.random() * 2) + 1,
    type: 'food',
    description: '恢复30点饥饿值。',
  });
  
  // 水
  items.push({
    id: `chest_water_${Date.now()}`,
    name: 'Water Bottle',
    nameZh: '水瓶',
    quantity: Math.floor(Math.random() * 2) + 1,
    type: 'water',
    description: '恢复30点水分值。',
  });
  
  // 弹药
  items.push({
    id: `chest_ammo_${Date.now()}`,
    name: '9mm Ammo',
    nameZh: '9mm弹药',
    quantity: Math.floor(Math.random() * 8) + 5,
    type: 'ammo',
    description: '9mm帕拉贝鲁姆弹药。',
  });
  
  // 医疗包
  items.push({
    id: `chest_med_${Date.now()}`,
    name: 'Medkit',
    nameZh: '医疗包',
    quantity: 1,
    type: 'medicine',
    description: '恢复25点生命值。',
  });
  
  // 特殊材料
  if (mapType === 'jungle' || mapType === 'swamp') {
    items.push({
      id: `chest_mat_${Date.now()}`,
      name: 'Cloth Scrap',
      nameZh: '布料碎片',
      quantity: Math.floor(Math.random() * 3) + 2,
      type: 'material',
      description: '用于制作护甲。',
    });
  }
  
  if (mapType === 'swamp' || mapType === 'cliff') {
    items.push({
      id: `chest_metal_${Date.now()}`,
      name: 'Metal Scrap',
      nameZh: '金属碎片',
      quantity: Math.floor(Math.random() * 3) + 2,
      type: 'material',
      description: '用于制作高级护甲。',
    });
  }
  
  return items;
}

// 创建地图
export function createMapRegion(
  mapType: MapType,
  _difficulty?: 'easy' | 'normal' | 'hard',
  unlocked: boolean = false
): MapRegion {
  const baseRegion: Partial<MapRegion> = {
    type: mapType,
    width: mapType === 'valley' ? 15 : 30,
    height: mapType === 'valley' ? 15 : 30,
    tiles: placeSpecialItems(generateTiles(mapType), mapType),
    squads: createSquads(mapType),
    chests: generateChests(mapType),
    creatures: generateCreatures(mapType),
    unlocked,
    cleared: false,
  };
  
  switch (mapType) {
    case 'beach':
      return {
        ...baseRegion,
        type: 'beach',
        name: 'The Beach',
        nameZh: '沙滩',
        width: 30,
        height: 30,
        exitPosition: { x: 28, y: 28 },
      } as MapRegion;
    case 'jungle':
      return {
        ...baseRegion,
        type: 'jungle',
        name: 'The Jungle',
        nameZh: '丛林',
        width: 30,
        height: 30,
        exitPosition: { x: 28, y: 28 },
        visionRange: 7,
      } as MapRegion;
    case 'swamp':
      return {
        ...baseRegion,
        type: 'swamp',
        name: 'The Swamp',
        nameZh: '沼泽',
        width: 30,
        height: 30,
        exitPosition: { x: 28, y: 28 },
        hungerDrainMult: 2,
        canDodge: false,
      } as MapRegion;
    case 'cliff':
      return {
        ...baseRegion,
        type: 'cliff',
        name: 'The Cliffs',
        nameZh: '岩壁',
        width: 30,
        height: 30,
        exitPosition: { x: 28, y: 28 },
        hasFlightEnemy: true,
      } as MapRegion;
    case 'valley':
      return {
        ...baseRegion,
        type: 'valley',
        name: 'The Valley',
        nameZh: '山谷',
        width: 15,
        height: 15,
        exitPosition: { x: 13, y: 13 },
      } as MapRegion;
  }
}

// 创建所有地图
export function createAllMaps(difficulty: 'easy' | 'normal' | 'hard'): MapRegion[] {
  return [
    createMapRegion('beach', difficulty, true), // 沙滩默认解锁
    createMapRegion('jungle', difficulty, false),
    createMapRegion('swamp', difficulty, false),
    createMapRegion('cliff', difficulty, false),
    createMapRegion('valley', difficulty, false),
  ];
}
