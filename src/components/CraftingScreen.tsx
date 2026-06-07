import { useState } from 'react';
import {
  ArrowLeft, Hammer, Package, Shield, Swords, Heart,
  CircleDot, Sparkles, Scroll, Zap, Gem, Droplet, Shirt, Settings, Flame, Cpu
} from 'lucide-react';
import { MATERIALS, CRAFT_RECIPES, RARITY_COLORS } from '@/data/materials';
import type { CraftRecipe } from '@/data/materials';

interface CraftingScreenProps {
  materials: Record<string, number>;
  onCraft: (recipeId: string) => void;
  onBack: () => void;
}

type TabType = 'armor' | 'weapon' | 'item';

const MATERIAL_ICONS: Record<string, typeof CircleDot> = {
  scrap_metal: Settings,
  scrap_cloth: Shirt,
  angel_fragment: Sparkles,
  angel_core: Zap,
  mystic_rune: Scroll,
  circuit_board: Cpu,
  crystal_shard: Gem,
  toxic_gland: Droplet,
  bone_fragment: CircleDot,
  flare_powder: Flame,
};

const TYPE_TABS: { key: TabType; label: string; icon: typeof Shield }[] = [
  { key: 'armor', label: '护甲', icon: Shield },
  { key: 'weapon', label: '武器', icon: Swords },
  { key: 'item', label: '道具', icon: Heart },
];

export function CraftingScreen({ materials, onCraft, onBack }: CraftingScreenProps) {
  const [tab, setTab] = useState<TabType>('armor');
  const [selectedRecipe, setSelectedRecipe] = useState<CraftRecipe | null>(null);

  const filteredRecipes = CRAFT_RECIPES.filter(r => r.type === tab);

  const canCraft = (recipe: CraftRecipe) => {
    return recipe.materials.every(m => (materials[m.materialId] || 0) >= m.quantity);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#1a1a2e]">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black" />

      <div className="relative z-10 flex flex-col h-full">
        {/* 头部 */}
        <div className="p-3 border-b border-gray-700 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm" style={{ fontFamily: 'monospace' }}>
            <ArrowLeft className="w-4 h-4" /><span>返回</span>
          </button>
          <h2 className="text-lg font-bold text-orange-400" style={{ fontFamily: '"Press Start 2P", monospace' }}>
            <Hammer className="w-5 h-5 inline mr-2" />装备制造
          </h2>
          <div className="text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>
            {Object.values(materials).reduce((a, b) => a + b, 0)} 材料
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* 左侧：材料库存 */}
          <div className="w-56 bg-gray-900/80 border-r border-gray-700 flex flex-col">
            <div className="p-2 text-xs text-gray-500 border-b border-gray-700" style={{ fontFamily: 'monospace' }}>
              <Package className="w-3 h-3 inline mr-1" />材料库存
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {MATERIALS.map(mat => {
                const count = materials[mat.id] || 0;
                const Icon = MATERIAL_ICONS[mat.id] || CircleDot;
                return (
                  <div key={mat.id} className={`flex items-center gap-2 p-2 rounded ${count > 0 ? 'bg-gray-800/60' : 'bg-gray-900/30 opacity-40'}`}>
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: RARITY_COLORS[mat.rarity] }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-300 truncate" style={{ fontFamily: 'monospace' }}>{mat.name}</div>
                      <div className="text-[10px] text-gray-500 truncate">{mat.description}</div>
                    </div>
                    <div className="text-xs font-bold" style={{ color: RARITY_COLORS[mat.rarity], fontFamily: 'monospace' }}>
                      x{count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 右侧：配方列表 */}
          <div className="flex-1 flex flex-col">
            {/* Tab切换 */}
            <div className="flex border-b border-gray-700">
              {TYPE_TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setSelectedRecipe(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-colors ${
                    tab === t.key ? 'bg-gray-800 text-white border-b-2 border-orange-500' : 'bg-gray-900 text-gray-500 hover:bg-gray-800 hover:text-gray-300'
                  }`}
                  style={{ fontFamily: 'monospace' }}
                >
                  <t.icon className="w-4 h-4" />{t.label}
                </button>
              ))}
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* 配方列表 */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredRecipes.map(recipe => {
                  const craftable = canCraft(recipe);
                  const isSelected = selectedRecipe?.id === recipe.id;
                  return (
                    <button
                      key={recipe.id}
                      onClick={() => setSelectedRecipe(isSelected ? null : recipe)}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        isSelected ? 'border-orange-500 bg-orange-900/20' : craftable ? 'border-gray-600 bg-gray-800/50 hover:bg-gray-800' : 'border-gray-800 bg-gray-900/30 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white font-bold" style={{ fontFamily: 'monospace' }}>{recipe.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${craftable ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`} style={{ fontFamily: 'monospace' }}>
                          {craftable ? '可制造' : '材料不足'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mb-2">{recipe.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {recipe.materials.map(m => {
                          const matDef = MATERIALS.find(d => d.id === m.materialId);
                          const have = materials[m.materialId] || 0;
                          return (
                            <span key={m.materialId} className={`text-[10px] px-1.5 py-0.5 rounded ${have >= m.quantity ? 'bg-gray-700 text-gray-300' : 'bg-red-900/30 text-red-400'}`} style={{ fontFamily: 'monospace' }}>
                              {matDef?.name || m.materialId}: {have}/{m.quantity}
                            </span>
                          );
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 选中配方详情 */}
              {selectedRecipe && (
                <div className="w-64 bg-gray-900/80 border-l border-gray-700 p-4 flex flex-col">
                  <h3 className="text-lg font-bold text-orange-400 mb-2" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.8rem' }}>{selectedRecipe.name}</h3>
                  <p className="text-xs text-gray-400 mb-4">{selectedRecipe.description}</p>

                  <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="text-[10px] text-gray-500 mb-1">制造结果</div>
                    <div className="text-sm text-white font-bold" style={{ fontFamily: 'monospace' }}>{selectedRecipe.result.name}</div>
                    <div className="text-xs text-yellow-400 mt-1">{selectedRecipe.result.stats}</div>
                    <div className="text-[10px] text-gray-500 mt-1">{selectedRecipe.result.description}</div>
                  </div>

                  <div className="mb-4 flex-1">
                    <div className="text-[10px] text-gray-500 mb-2">所需材料</div>
                    {selectedRecipe.materials.map(m => {
                      const matDef = MATERIALS.find(d => d.id === m.materialId);
                      const have = materials[m.materialId] || 0;
                      const Icon = matDef ? (MATERIAL_ICONS[matDef.id] || CircleDot) : CircleDot;
                      return (
                        <div key={m.materialId} className="flex items-center gap-2 mb-1.5">
                          <Icon className="w-3 h-3" style={{ color: matDef ? RARITY_COLORS[matDef.rarity] : '#666' }} />
                          <span className="text-xs text-gray-300 flex-1">{matDef?.name}</span>
                          <span className={`text-xs font-bold ${have >= m.quantity ? 'text-green-400' : 'text-red-400'}`} style={{ fontFamily: 'monospace' }}>
                            {have}/{m.quantity}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => canCraft(selectedRecipe) && onCraft(selectedRecipe.id)}
                    disabled={!canCraft(selectedRecipe)}
                    className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
                      canCraft(selectedRecipe)
                        ? 'bg-orange-600 hover:bg-orange-500 text-white hover:scale-105'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                    style={{ fontFamily: 'monospace' }}
                  >
                    <Hammer className="w-4 h-4 inline mr-1" />
                    {canCraft(selectedRecipe) ? '开始制造' : '材料不足'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
