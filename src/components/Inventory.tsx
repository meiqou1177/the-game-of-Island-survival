import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Package, Utensils, Droplets, Crosshair,
  Heart, Shield, Swords, User, FlaskConical, Hammer, Wrench,
  X, ChevronRight
} from 'lucide-react';
import type { PlayerState, Item, Weapon, Armor } from '@/types/game';
import { MATERIALS, CRAFT_RECIPES, RARITY_COLORS } from '@/data/materials';

type TabType = 'items' | 'equip' | 'craft';

interface InventoryProps {
  player: PlayerState;
  onUseItem: (itemId: string) => void;
  onSwitchWeapon: (weaponId: string) => void;
  onEquipArmor: (armorId: string) => void;
  onCraft: (recipeId: string) => void;
  onBack: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  food: '#E67E22', water: '#3498DB', ammo: '#95a5a6', medicine: '#E74C3C', material: '#9b59b6',
};

const MATERIAL_ICONS: Record<string, typeof Wrench> = {
  scrap_metal: Wrench, scrap_cloth: Package, angel_fragment: FlaskConical,
  angel_core: Heart, mystic_rune: Shield, circuit_board: Wrench,
  crystal_shard: FlaskConical, toxic_gland: Droplets, bone_fragment: Package,
  flare_powder: Hammer,
};

// ===== 装备面板（带弹出式滑动列表） =====
function EquipmentPanel({
  player,
  onSwitchWeapon,
  onEquipArmor,
}: {
  player: PlayerState;
  onSwitchWeapon: (weaponId: string) => void;
  onEquipArmor: (armorId: string) => void;
}) {
  const [showWeaponList, setShowWeaponList] = useState(false);
  const [showArmorList, setShowArmorList] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* 角色头像 */}
      <div className="flex items-center gap-4 p-3 bg-gray-800/40 rounded-lg">
        <div className="w-16 h-16 rounded-lg bg-gray-800 border-2 border-orange-500/50 flex items-center justify-center overflow-hidden flex-shrink-0">
          <img src="/assets/player_idle.png" alt="角色" className="w-full h-full" style={{ imageRendering: 'pixelated', objectFit: 'contain' }} />
        </div>
        <div>
          <p className="text-sm text-white font-bold" style={{ fontFamily: 'monospace' }}>航天员</p>
          <p className="text-[10px] text-gray-500">生存第 {player.daysSurvived} 天 | 击杀 {player.kills}</p>
        </div>
      </div>

      {/* 武器装备槽 */}
      <div>
        <div className="text-xs text-gray-500 mb-2" style={{ fontFamily: 'monospace' }}><Swords className="w-3 h-3 inline mr-1" />武器槽（点击切换）</div>
        <button
          onClick={() => { setShowWeaponList(true); setShowArmorList(false); }}
          className="w-full p-4 rounded-lg border-2 border-orange-500/50 bg-orange-900/10 hover:bg-orange-900/30 transition-all text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{player.currentWeapon.type === 'ranged' ? '\u{1F52B}' : '\u{2694}'}</span>
              <div>
                <p className="text-sm text-white font-bold" style={{ fontFamily: 'monospace' }}>{player.currentWeapon.nameZh}</p>
                <p className="text-[10px] text-gray-500">{player.currentWeapon.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-orange-400 font-bold" style={{ fontFamily: 'monospace' }}>伤害:{player.currentWeapon.damage}</span>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>
          </div>
        </button>
      </div>

      {/* 护甲装备槽 */}
      <div>
        <div className="text-xs text-gray-500 mb-2" style={{ fontFamily: 'monospace' }}><Shield className="w-3 h-3 inline mr-1" />护甲槽（点击切换）</div>
        <button
          onClick={() => { setShowArmorList(true); setShowWeaponList(false); }}
          className="w-full p-4 rounded-lg border-2 border-purple-500/50 bg-purple-900/10 hover:bg-purple-900/30 transition-all text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-7 h-7 text-purple-400" />
              <div>
                <p className="text-sm text-white font-bold" style={{ fontFamily: 'monospace' }}>{player.currentArmor?.nameZh || '无护甲'}</p>
                <p className="text-[10px] text-gray-500">{player.currentArmor?.description || '没有穿戴护甲，受到全额伤害'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {player.currentArmor && <span className="text-xs text-purple-400 font-bold" style={{ fontFamily: 'monospace' }}>减伤:{player.currentArmor.defense}%</span>}
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>
          </div>
        </button>
      </div>

      {/* ===== 弹出式武器切换面板 ===== */}
      {showWeaponList && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setShowWeaponList(false)}>
          <div className="w-full max-w-md bg-gray-900 border-t border-gray-700 rounded-t-xl p-4 max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm text-white font-bold" style={{ fontFamily: 'monospace' }}><Swords className="w-4 h-4 inline mr-1" />选择武器</h3>
              <button onClick={() => setShowWeaponList(false)} className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {player.weapons.map(w => {
                const equipped = player.currentWeapon.id === w.id;
                return (
                  <button
                    key={w.id}
                    onClick={() => { if (!equipped) onSwitchWeapon(w.id); setShowWeaponList(false); }}
                    className={`w-full p-3 rounded-lg border text-left transition-all flex-shrink-0 ${
                      equipped ? 'border-orange-500 bg-orange-900/20' : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{w.type === 'ranged' ? '\u{1F52B}' : '\u{2694}'}</span>
                        <div>
                          <span className="text-sm text-white" style={{ fontFamily: 'monospace' }}>{w.nameZh}</span>
                          {equipped && <span className="text-[10px] text-orange-400 ml-2">[装备中]</span>}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>伤害:{w.damage}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">{w.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== 弹出式护甲切换面板 ===== */}
      {showArmorList && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setShowArmorList(false)}>
          <div className="w-full max-w-md bg-gray-900 border-t border-gray-700 rounded-t-xl p-4 max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm text-white font-bold" style={{ fontFamily: 'monospace' }}><Shield className="w-4 h-4 inline mr-1" />选择护甲</h3>
              <button onClick={() => setShowArmorList(false)} className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {player.armors.length === 0 && (
                <p className="text-center text-gray-500 text-sm py-8" style={{ fontFamily: 'monospace' }}>没有护甲，请先制造</p>
              )}
              {player.armors.map(a => {
                const equipped = player.currentArmor?.id === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => { if (!equipped) onEquipArmor(a.id); setShowArmorList(false); }}
                    className={`w-full p-3 rounded-lg border text-left transition-all flex-shrink-0 ${
                      equipped ? 'border-purple-500 bg-purple-900/20' : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-400" />
                        <div>
                          <span className="text-sm text-white" style={{ fontFamily: 'monospace' }}>{a.nameZh}</span>
                          {equipped && <span className="text-[10px] text-purple-400 ml-2">[穿戴中]</span>}
                        </div>
                      </div>
                      <span className="text-xs text-purple-400" style={{ fontFamily: 'monospace' }}>减伤:{a.defense}%</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">{a.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Inventory({ player, onUseItem, onSwitchWeapon, onEquipArmor, onCraft, onBack }: InventoryProps) {
  // 辅助函数：获取背包中材料数量
  const getMatQty = (matId: string) => player.inventory.find(i => i.id === matId && i.type === 'material')?.quantity || 0;
  const [tab, setTab] = useState<TabType>('items');
  const [selectedItem, setSelectedItem] = useState<Item | Weapon | Armor | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [fKeyHint, setFKeyHint] = useState(false);

  // F键使用物品
  const handleUseSelected = useCallback(() => {
    if (selectedItem && 'type' in selectedItem) {
      const item = selectedItem as Item;
      if (item.type === 'food' || item.type === 'water' || item.type === 'medicine') {
        onUseItem(item.id);
        setSelectedItem(null);
      }
    }
  }, [selectedItem, onUseItem]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        handleUseSelected();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUseSelected]);

  // 显示F键提示动画
  useEffect(() => {
    if (selectedItem && 'type' in selectedItem && ['food', 'water', 'medicine'].includes((selectedItem as Item).type)) {
      setFKeyHint(true);
    } else {
      setFKeyHint(false);
    }
  }, [selectedItem]);

  const consumables = player.inventory.filter(i => i.type !== 'material' && i.type !== 'weapon' && i.type !== 'armor');
  const matItems = player.inventory.filter(i => i.type === 'material');
  const weaponItems = player.inventory.filter(i => i.type === 'weapon');
  const armorItems = player.inventory.filter(i => i.type === 'armor');

  const getIcon = (type: string) => {
    switch (type) {
      case 'food': return <Utensils className="w-5 h-5 text-orange-400" />;
      case 'water': return <Droplets className="w-5 h-5 text-blue-400" />;
      case 'ammo': return <Crosshair className="w-5 h-5 text-gray-400" />;
      case 'medicine': return <Heart className="w-5 h-5 text-red-400" />;
      case 'weapon': return <Swords className="w-5 h-5 text-yellow-400" />;
      case 'armor': return <Shield className="w-5 h-5 text-purple-400" />;
      default: return <Package className="w-5 h-5 text-gray-400" />;
    }
  };

  const canCraft = (recipeId: string) => {
    const r = CRAFT_RECIPES.find(x => x.id === recipeId);
    return r ? r.materials.every(m => getMatQty(m.materialId) >= m.quantity) : false;
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#1a1a2e]">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black" />

      <div className="relative z-10 flex flex-col h-full">
        {/* 顶部栏 */}
        <div className="p-3 border-b border-gray-700 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm" style={{ fontFamily: 'monospace' }}>
            <ArrowLeft className="w-4 h-4" /><span>返回</span>
          </button>
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.7rem' }}>
            <Package className="w-4 h-4 inline mr-2" />背包
          </h2>
          <div className="text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>
            {consumables.length} 物品
          </div>
        </div>

        {/* 快捷标签栏 */}
        <div className="flex border-b border-gray-700">
          {([
            { key: 'items' as TabType, label: '物品', icon: Package },
            { key: 'equip' as TabType, label: '装备', icon: User },
            { key: 'craft' as TabType, label: '制造', icon: Hammer },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSelectedItem(null); setSelectedRecipe(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-colors ${
                tab === t.key ? 'bg-gray-800 text-white border-b-2 border-orange-500' : 'bg-gray-900 text-gray-500 hover:bg-gray-800'
              }`}
              style={{ fontFamily: 'monospace' }}
            >
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* ===== 左侧主内容区 ===== */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

            {/* --- 物品标签 --- */}
            {tab === 'items' && (
              <div className="flex-1 overflow-y-auto p-4">
                {/* 状态条 */}
                <div className="grid grid-cols-4 gap-2 mb-4 p-2 bg-gray-800/40 rounded-lg">
                  {[
                    { label: 'HP', val: `${player.hp}/${player.maxHp}`, color: 'text-red-400' },
                    { label: '饥饿', val: `${Math.floor(player.hunger)}`, color: 'text-orange-400' },
                    { label: '水分', val: `${Math.floor(player.water)}`, color: 'text-blue-400' },
                    { label: '弹药', val: `${player.ammo}`, color: 'text-gray-400' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <div className={`text-lg font-bold ${s.color}`} style={{ fontFamily: 'monospace' }}>{s.val}</div>
                      <div className="text-[9px] text-gray-500">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* 1. 装备中 */}
                {(player.currentWeapon || player.currentArmor) && (
                  <>
                    <div className="mb-2 text-xs text-orange-400 font-bold" style={{ fontFamily: 'monospace' }}>
                      <Shield className="w-3 h-3 inline mr-1" />装备中
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {player.currentWeapon && (
                        <div className="relative p-2 rounded-lg border-2 border-orange-500/50 bg-orange-900/20 flex flex-col items-center gap-1">
                          <Swords className="w-5 h-5 text-orange-400" />
                          <span className="text-[8px] text-white text-center truncate w-full" style={{ fontFamily: 'monospace' }}>{player.currentWeapon.nameZh}</span>
                          <span className="text-[8px] text-orange-400" style={{ fontFamily: 'monospace' }}>伤害:{player.currentWeapon.damage}</span>
                          <span className="absolute top-0.5 right-1 text-[7px] text-orange-400 font-bold">[装备]</span>
                        </div>
                      )}
                      {player.currentArmor && (
                        <div className="relative p-2 rounded-lg border-2 border-purple-500/50 bg-purple-900/20 flex flex-col items-center gap-1">
                          <Shield className="w-5 h-5 text-purple-400" />
                          <span className="text-[8px] text-white text-center truncate w-full" style={{ fontFamily: 'monospace' }}>{player.currentArmor.nameZh}</span>
                          <span className="text-[8px] text-purple-400" style={{ fontFamily: 'monospace' }}>减伤:{player.currentArmor.defense}%</span>
                          <span className="absolute top-0.5 right-1 text-[7px] text-purple-400 font-bold">[穿戴]</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* 2. 消耗品 */}
                {consumables.length > 0 && (
                  <>
                    <div className="mb-2 text-xs text-green-400 font-bold" style={{ fontFamily: 'monospace' }}>
                      <Package className="w-3 h-3 inline mr-1" />消耗品
                    </div>
                    <div className="grid grid-cols-6 gap-2 mb-3">
                      {consumables.map((item, i) => (
                        <button
                          key={`${item.id}-${i}`}
                          onClick={() => setSelectedItem(selectedItem && (selectedItem as Item).id === item.id ? null : item)}
                          className={`relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-105 ${
                            selectedItem && (selectedItem as Item).id === item.id
                              ? 'border-orange-500 bg-orange-900/30 shadow-lg shadow-orange-500/20'
                              : 'bg-gray-800/60 border-gray-700/50'
                          }`}
                        >
                          {getIcon(item.type)}
                          <span className="text-[8px] text-gray-400 truncate w-full text-center px-1" style={{ fontFamily: 'monospace' }}>{item.nameZh}</span>
                          <span className="absolute top-0.5 right-1 text-[9px] font-bold" style={{ color: TYPE_COLORS[item.type] || '#fff', fontFamily: 'monospace' }}>
                            x{item.quantity}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* 3. 背包中的武器（可点击装备） */}
                {weaponItems.length > 0 && (
                  <>
                    <div className="mb-2 text-xs text-yellow-400 font-bold" style={{ fontFamily: 'monospace' }}>
                      <Swords className="w-3 h-3 inline mr-1" />武器道具
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {weaponItems.map(item => {
                        const isEquipped = player.currentWeapon.nameZh === item.nameZh;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedItem(selectedItem && selectedItem.id === item.id ? null : item)}
                            className={`relative p-2 rounded-lg border-2 flex flex-col items-center gap-1 transition-all hover:scale-105 ${
                              isEquipped ? 'border-yellow-500 bg-yellow-900/30' : 'bg-gray-800/60 border-gray-700/50'
                            } ${selectedItem && selectedItem.id === item.id ? 'ring-2 ring-orange-500' : ''}`}
                          >
                            <Swords className="w-5 h-5 text-yellow-400" />
                            <span className="text-[8px] text-gray-400 text-center truncate w-full" style={{ fontFamily: 'monospace' }}>{item.nameZh}</span>
                            <span className="text-[8px] text-yellow-400" style={{ fontFamily: 'monospace' }}>伤害:{item.damage}</span>
                            {isEquipped && <span className="absolute top-0.5 right-1 text-[7px] text-yellow-400 font-bold">[装备]</span>}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* 4. 背包中的护甲（可点击穿戴） */}
                {armorItems.length > 0 && (
                  <>
                    <div className="mb-2 text-xs text-purple-400 font-bold" style={{ fontFamily: 'monospace' }}>
                      <Shield className="w-3 h-3 inline mr-1" />护甲道具
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {armorItems.map(item => {
                        const isEquipped = player.currentArmor?.nameZh === item.nameZh;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedItem(selectedItem && selectedItem.id === item.id ? null : item)}
                            className={`relative p-2 rounded-lg border-2 flex flex-col items-center gap-1 transition-all hover:scale-105 ${
                              isEquipped ? 'border-purple-500 bg-purple-900/30' : 'bg-gray-800/60 border-gray-700/50'
                            } ${selectedItem && selectedItem.id === item.id ? 'ring-2 ring-purple-500' : ''}`}
                          >
                            <Shield className="w-5 h-5 text-purple-400" />
                            <span className="text-[8px] text-gray-400 text-center truncate w-full" style={{ fontFamily: 'monospace' }}>{item.nameZh}</span>
                            <span className="text-[8px] text-purple-400" style={{ fontFamily: 'monospace' }}>减伤:{item.defense}%</span>
                            {isEquipped && <span className="absolute top-0.5 right-1 text-[7px] text-purple-400 font-bold">[穿戴]</span>}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* 5. 弹药 */}
                {player.ammo > 0 && (
                  <>
                    <div className="mb-2 text-xs text-blue-400 font-bold" style={{ fontFamily: 'monospace' }}>
                      <Crosshair className="w-3 h-3 inline mr-1" />弹药
                    </div>
                    <div className="grid grid-cols-6 gap-2 mb-3">
                      <div className="relative aspect-square rounded-lg border-2 bg-blue-900/20 border-blue-700/40 flex flex-col items-center justify-center gap-0.5">
                        <Crosshair className="w-5 h-5 text-blue-400" />
                        <span className="text-[8px] text-gray-400 text-center" style={{ fontFamily: 'monospace' }}>弹药</span>
                        <span className="absolute top-0.5 right-1 text-[9px] font-bold text-blue-400" style={{ fontFamily: 'monospace' }}>x{player.ammo}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* 4. 武器 */}
                {player.weapons.length > 0 && (
                  <>
                    <div className="mb-2 text-xs text-yellow-400 font-bold" style={{ fontFamily: 'monospace' }}>
                      <Swords className="w-3 h-3 inline mr-1" />武器 ({player.weapons.length})
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {player.weapons.map(w => {
                        const equipped = player.currentWeapon.id === w.id;
                        return (
                          <button
                            key={w.id}
                            onClick={() => setSelectedItem(selectedItem && selectedItem.id === w.id ? null : w)}
                            className={`relative p-2 rounded-lg border-2 flex flex-col items-center gap-1 transition-all hover:scale-105 ${
                              equipped ? 'border-yellow-500 bg-yellow-900/30' : 'bg-gray-800/60 border-gray-700/50'
                            } ${selectedItem && selectedItem.id === w.id ? 'ring-2 ring-orange-500' : ''}`}
                          >
                            <span className="text-lg">{w.type === 'ranged' ? '\u{1F52B}' : '\u{2694}'}</span>
                            <span className="text-[8px] text-gray-400 text-center truncate w-full" style={{ fontFamily: 'monospace' }}>{w.nameZh}</span>
                            <span className="text-[8px] text-yellow-400" style={{ fontFamily: 'monospace' }}>伤害:{w.damage}</span>
                            {equipped && <span className="absolute top-0.5 right-1 text-[7px] text-yellow-400 font-bold">[装备]</span>}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* 5. 护甲 */}
                {player.armors.length > 0 && (
                  <>
                    <div className="mb-2 text-xs text-purple-400 font-bold" style={{ fontFamily: 'monospace' }}>
                      <Shield className="w-3 h-3 inline mr-1" />护甲 ({player.armors.length})
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {player.armors.map(a => {
                        const equipped = player.currentArmor?.id === a.id;
                        return (
                          <button
                            key={a.id}
                            onClick={() => setSelectedItem(selectedItem && selectedItem.id === a.id ? null : a)}
                            className={`relative p-2 rounded-lg border-2 flex flex-col items-center gap-1 transition-all hover:scale-105 ${
                              equipped ? 'border-purple-500 bg-purple-900/30' : 'bg-gray-800/60 border-gray-700/50'
                            } ${selectedItem && selectedItem.id === a.id ? 'ring-2 ring-purple-500' : ''}`}
                          >
                            <Shield className="w-5 h-5 text-purple-400" />
                            <span className="text-[8px] text-gray-400 text-center truncate w-full" style={{ fontFamily: 'monospace' }}>{a.nameZh}</span>
                            <span className="text-[8px] text-purple-400" style={{ fontFamily: 'monospace' }}>减伤:{a.defense}%</span>
                            {equipped && <span className="absolute top-0.5 right-1 text-[7px] text-purple-400 font-bold">[穿戴]</span>}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* 6. 材料格子 */}
                {matItems.length > 0 && (
                  <>
                    <div className="mt-2 mb-2 text-xs text-gray-400 font-bold" style={{ fontFamily: 'monospace' }}>
                      <FlaskConical className="w-3 h-3 inline mr-1" />材料
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {matItems.map((item, i) => (
                        <div key={`${item.id}-${i}`} className="relative aspect-square rounded-lg border-2 bg-purple-900/20 border-purple-700/40 flex flex-col items-center justify-center gap-0.5">
                          <FlaskConical className="w-5 h-5 text-purple-400" />
                          <span className="text-[8px] text-gray-400 truncate w-full text-center px-1" style={{ fontFamily: 'monospace' }}>{item.nameZh}</span>
                          <span className="absolute top-0.5 right-1 text-[9px] font-bold text-purple-400" style={{ fontFamily: 'monospace' }}>x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* 空背包提示 */}
                {consumables.length === 0 && weaponItems.length === 0 && armorItems.length === 0 && player.ammo === 0 && matItems.length === 0 && (
                  <p className="text-center text-gray-500 mt-20 text-sm" style={{ fontFamily: 'monospace' }}>背包空空如也</p>
                )}

                {/* 选中物品操作 */}
                {selectedItem && 'type' in selectedItem && (selectedItem as Item).type !== 'material' && (
                  <div className="mt-4 p-3 bg-gray-800/60 rounded-lg border border-gray-600 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getIcon((selectedItem as Item).type)}
                      <div>
                        <p className="text-sm text-white" style={{ fontFamily: 'monospace' }}>{(selectedItem as Item).nameZh}</p>
                        <p className="text-[10px] text-gray-500">
                          {(selectedItem as Item).type === 'weapon' ? `伤害:${(selectedItem as Item).damage} | 点击装备` :
                           (selectedItem as Item).type === 'armor' ? `减伤:${(selectedItem as Item).defense}% | 点击穿戴` :
                           (selectedItem as Item).description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* F键提示 */}
                      {fKeyHint && (
                        <span className="px-2 py-1 bg-green-600/30 border border-green-500/50 rounded text-[10px] text-green-400 animate-pulse" style={{ fontFamily: 'monospace' }}>
                          按F使用
                        </span>
                      )}
                      <button
                        onClick={() => { onUseItem((selectedItem as Item).id); setSelectedItem(null); }}
                        className={`px-4 py-2 text-white rounded-lg text-xs font-bold ${
                          (selectedItem as Item).type === 'weapon' ? 'bg-yellow-600 hover:bg-yellow-500' :
                          (selectedItem as Item).type === 'armor' ? 'bg-purple-600 hover:bg-purple-500' :
                          'bg-green-600 hover:bg-green-500'
                        }`}
                        style={{ fontFamily: 'monospace' }}
                      >
                        {(selectedItem as Item).type === 'weapon' ? '装备' :
                         (selectedItem as Item).type === 'armor' ? '穿戴' : '使用'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- 装备标签 --- */}
            {tab === 'equip' && (
              <EquipmentPanel
                player={player}
                onSwitchWeapon={onSwitchWeapon}
                onEquipArmor={onEquipArmor}
              />
            )}

            {/* --- 制造标签 --- */}
            {tab === 'craft' && (
              <div className="flex-1 overflow-hidden flex">
                {/* 配方列表 */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {CRAFT_RECIPES.map(r => {
                    const ok = canCraft(r.id);
                    return (
                      <button
                        key={r.id}
                        onClick={() => setSelectedRecipe(selectedRecipe === r.id ? null : r.id)}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          selectedRecipe === r.id ? 'border-orange-500 bg-orange-900/20' :
                          ok ? 'border-gray-600 bg-gray-800/50 hover:bg-gray-800' : 'border-gray-800 bg-gray-900/30 opacity-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white font-bold" style={{ fontFamily: 'monospace' }}>{r.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded ${ok ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`} style={{ fontFamily: 'monospace' }}>
                            {ok ? '可制造' : '材料不足'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mb-2">{r.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {r.materials.map(m => {
                            const md = MATERIALS.find(d => d.id === m.materialId);
                            const have = getMatQty(m.materialId);
                            return (
                              <span key={m.materialId} className={`text-[9px] px-1.5 py-0.5 rounded ${have >= m.quantity ? 'bg-gray-700 text-gray-300' : 'bg-red-900/30 text-red-400'}`} style={{ fontFamily: 'monospace' }}>
                                {md?.name}:{have}/{m.quantity}
                              </span>
                            );
                          })}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* 配方详情 */}
                {selectedRecipe && (() => {
                  const r = CRAFT_RECIPES.find(x => x.id === selectedRecipe);
                  if (!r) return null;
                  const ok = canCraft(r.id);
                  return (
                    <div className="w-56 bg-gray-900/80 border-l border-gray-700 p-4 flex flex-col">
                      <h3 className="text-sm font-bold text-orange-400 mb-2" style={{ fontFamily: 'monospace' }}>{r.name}</h3>
                      <p className="text-[10px] text-gray-400 mb-3">{r.description}</p>

                      <div className="mb-3 p-2 bg-gray-800/50 rounded border border-gray-700">
                        <div className="text-[9px] text-gray-500 mb-1">结果</div>
                        <div className="text-sm text-white font-bold" style={{ fontFamily: 'monospace' }}>{r.result.name}</div>
                        <div className="text-[10px] text-yellow-400">{r.result.stats}</div>
                      </div>

                      <div className="flex-1">
                        <div className="text-[9px] text-gray-500 mb-1">所需材料</div>
                        {r.materials.map(m => {
                          const md = MATERIALS.find(d => d.id === m.materialId);
                          const have = getMatQty(m.materialId);
                          const Icon = md ? (MATERIAL_ICONS[md.id] || Wrench) : Wrench;
                          return (
                            <div key={m.materialId} className="flex items-center gap-1.5 mb-1">
                              <Icon className="w-3 h-3" style={{ color: md ? RARITY_COLORS[md.rarity] : '#666' }} />
                              <span className="text-[10px] text-gray-300 flex-1">{md?.name}</span>
                              <span className={`text-[10px] font-bold ${have >= m.quantity ? 'text-green-400' : 'text-red-400'}`} style={{ fontFamily: 'monospace' }}>{have}/{m.quantity}</span>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => ok && onCraft(r.id)}
                        disabled={!ok}
                        className={`w-full py-3 rounded-lg font-bold text-xs transition-all ${ok ? 'bg-orange-600 hover:bg-orange-500 text-white hover:scale-105' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                        style={{ fontFamily: 'monospace' }}
                      >
                        <Hammer className="w-3 h-3 inline mr-1" />{ok ? '制造' : '材料不足'}
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
