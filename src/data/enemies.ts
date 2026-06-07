import type { Enemy, EnemySquad, MapType, EnemySkillResult } from '@/types/game';

// ===== 敌人创建 =====
export function createEnemy(type: 'sand' | 'wood' | 'stone' | 'fly' | 'boss'): Enemy {
  switch (type) {
    case 'sand':
      return {
        id: `sand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'sand',
        name: 'Sand Angel',
        nameZh: '沙质天使',
        hp: 10,
        maxHp: 10,
        damage: 10,
        damageType: 'physical',
        sprite: '/assets/enemy_sand.png',
        canMove: true,
      };
    case 'wood':
      return {
        id: `wood_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'wood',
        name: 'Wood Angel',
        nameZh: '木制天使',
        hp: 30,
        maxHp: 30,
        damage: 20,
        damageType: 'physical',
        sprite: '/assets/enemy_wood.png',
        hasDoubleDamage: true,
        doubleDamageChance: 0.3,
        canMove: true,
      };
    case 'stone':
      return {
        id: `stone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'stone',
        name: 'Stone Angel',
        nameZh: '石制天使',
        hp: 50,
        maxHp: 50,
        damage: 20,
        damageType: 'magic',  // 法术伤害，无视护甲
        sprite: '/assets/enemy_stone.png',
        canMove: true,
      };
    case 'fly':
      return {
        id: `fly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'fly',
        name: 'Flying Angel',
        nameZh: '飞行天使',
        hp: 50,
        maxHp: 50,
        damage: 40,
        damageType: 'physical',
        sprite: '/assets/enemy_fly.png',
        hasDodge: true,
        dodgeChance: 0.3,
        canMove: true,
      };
    case 'boss':
      return {
        id: `boss_${Date.now()}`,
        type: 'boss',
        name: 'The Assembler',
        nameZh: '拼装之主',
        hp: 100,
        maxHp: 100,
        damage: 30,
        damageType: 'physical',
        sprite: '/assets/enemy_boss.png',
        hasDodge: true,
        dodgeChance: 0.3,
        hasSummon: true,
        summonChance: 0.3,
        hasHeal: true,
        healChance: 0.3,
        healAmount: 10,
        skillCooldown: 0,  // BOSS技能冷却（两回合限一次）
        canMove: true,
      };
  }
}

// ===== 敌人技能触发 =====
export function triggerEnemySkill(enemy: Enemy): EnemySkillResult {
  // 木制天使：30%触发双倍伤害（在攻击时判定）
  if (enemy.hasDoubleDamage && Math.random() < (enemy.doubleDamageChance || 0)) {
    return { type: 'double_damage' };
  }

  // 飞行天使：30%触发闪避
  if (enemy.hasDodge && Math.random() < (enemy.dodgeChance || 0)) {
    return { type: 'dodge' };
  }

  // BOSS技能（有冷却限制）
  if (enemy.type === 'boss' && enemy.skillCooldown === 0) {
    const roll = Math.random();
    if (enemy.hasDodge && roll < (enemy.dodgeChance || 0)) {
      return { type: 'dodge' };
    }
    if (enemy.hasSummon && roll < (enemy.dodgeChance || 0) + (enemy.summonChance || 0)) {
      return { type: 'summon' };
    }
    if (enemy.hasHeal && roll < (enemy.dodgeChance || 0) + (enemy.summonChance || 0) + (enemy.healChance || 0)) {
      return { type: 'heal', amount: enemy.healAmount || 10 };
    }
  }

  return null;
}

// ===== 创建天使小队 =====
export function createSquads(mapType: MapType, _difficulty?: string): EnemySquad[] {
  const squads: EnemySquad[] = [];

  switch (mapType) {
    case 'beach': {
      const positions = [
        { x: 8, y: 8 }, { x: 22, y: 8 }, { x: 8, y: 22 }, { x: 22, y: 22 }
      ];
      for (let i = 0; i < 4; i++) {
        const enemies: Enemy[] = [];
        for (let j = 0; j < 5; j++) enemies.push(createEnemy('sand'));
        squads.push({
          id: `beach_squad_${i}`,
          mapType: 'beach',
          enemies,
          defeated: false,
          position: positions[i],
        });
      }
      break;
    }
    case 'jungle': {
      const positions = [
        { x: 10, y: 10 }, { x: 20, y: 15 }, { x: 10, y: 20 }
      ];
      for (let i = 0; i < 3; i++) {
        const enemies: Enemy[] = [];
        for (let j = 0; j < 5; j++) enemies.push(createEnemy('wood'));
        squads.push({
          id: `jungle_squad_${i}`,
          mapType: 'jungle',
          enemies,
          defeated: false,
          position: positions[i],
        });
      }
      break;
    }
    case 'swamp': {
      const positions = [
        { x: 5, y: 5 }, { x: 15, y: 5 }, { x: 25, y: 5 },
        { x: 5, y: 25 }, { x: 15, y: 25 }, { x: 25, y: 25 }
      ];
      for (let i = 0; i < 6; i++) {
        const enemies: Enemy[] = [];
        for (let j = 0; j < 4; j++) enemies.push(createEnemy('stone'));
        squads.push({
          id: `swamp_squad_${i}`,
          mapType: 'swamp',
          enemies,
          defeated: false,
          position: positions[i],
        });
      }
      break;
    }
    case 'cliff': {
      squads.push({
        id: 'cliff_squad_0',
        mapType: 'cliff',
        enemies: [createEnemy('fly')],
        defeated: false,
        position: { x: 15, y: 15 },
      });
      break;
    }
    case 'valley': {
      squads.push({
        id: 'valley_squad_0',
        mapType: 'valley',
        enemies: [createEnemy('boss')],
        defeated: false,
        position: { x: 7, y: 7 },
      });
      break;
    }
  }

  return squads;
}
