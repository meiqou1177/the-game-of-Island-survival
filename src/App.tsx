import { useState, useEffect } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { MainMenu } from '@/components/MainMenu';
import { SubjectGradeSelect } from '@/components/SubjectGradeSelect';
import { GameScreen } from '@/components/GameScreen';
import { CombatScreen } from '@/components/CombatScreen';
import { GameOver } from '@/components/GameOver';
import { VictoryScreen } from '@/components/VictoryScreen';
import { Leaderboard } from '@/components/Leaderboard';
import { Inventory } from '@/components/Inventory';
import './App.css';

function App() {
  const {
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
  } = useGameState();

  // 背包overlay
  const [showInventory, setShowInventory] = useState(false);

  // TAB键 = 打开/关闭背包 | E键 = 捕获狗
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        if (state.screen === 'exploration' || state.screen === 'combat') {
          setShowInventory(prev => !prev);
        }
      }
      if (e.key === 'Escape' && showInventory) {
        setShowInventory(false);
      }
      // E键捕获狗（仅在探索模式且靠近狗时）
      if (e.key === 'e' || e.key === 'E') {
        if (state.screen === 'exploration') {
          captureDog();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.screen, showInventory, captureDog]);

  // 切屏时关闭背包
  useEffect(() => {
    setShowInventory(false);
  }, [state.screen]);

  const mapReached = state.currentMap?.nameZh || '沙滩';
  const inGame = state.screen === 'exploration' || state.screen === 'combat';

  const renderScreen = () => {
    switch (state.screen) {
      case 'main_menu':
        return <MainMenu onStart={() => setScreen('difficulty_select')} onLeaderboard={() => setScreen('leaderboard')} onSettings={() => {}} onTutorial={() => {}} />;
      case 'difficulty_select':
        return <SubjectGradeSelect onSelect={startGame} onBack={goBack} />;
      case 'exploration':
        return state.currentMap ? <GameScreen currentMap={state.currentMap} player={state.player} weather={state.weather} pet={state.pet} logs={state.logs} isPaused={state.isPaused} onMove={movePlayer} onPause={togglePause} onInventory={() => setShowInventory(true)} onOpenChest={openChest} /> : null;
      case 'combat':
        return <CombatScreen combat={state.combat} player={state.player} pet={state.pet} onAnswer={answerQuestion} onSwitchWeapon={switchWeapon} onActivateDodge={activateDodge} onEnemyTurn={enemyTurn} />;
      case 'inventory':
        return <Inventory player={state.player} onUseItem={useItem} onSwitchWeapon={switchWeapon} onEquipArmor={equipArmor} onCraft={craft} onBack={goBack} />;
      case 'game_over':
        return <GameOver player={state.player} difficulty={state.settings.difficulty} mapReached={mapReached} onRestart={() => setScreen('difficulty_select')} onMenu={resetGame} onSaveScore={saveToLeaderboard} />;
      case 'victory':
        return <VictoryScreen player={state.player} difficulty={state.settings.difficulty} onRestart={() => setScreen('difficulty_select')} onMenu={resetGame} onSaveScore={saveToLeaderboard} />;
      case 'leaderboard':
        return <Leaderboard entries={state.leaderboard} onBack={goBack} />;
      default:
        return <MainMenu onStart={() => setScreen('difficulty_select')} onLeaderboard={() => setScreen('leaderboard')} onSettings={() => {}} onTutorial={() => {}} />;
    }
  };

  return (
    <>
      {renderScreen()}

      {/* 背包 Overlay - TAB打开 */}
      {showInventory && (
        <div className="fixed inset-0 z-50">
          <Inventory
            player={state.player}
            onUseItem={useItem}
            onSwitchWeapon={switchWeapon}
            onEquipArmor={equipArmor}
            onCraft={craft}
            onBack={() => setShowInventory(false)}
          />
        </div>
      )}

      {/* TAB提示 */}
      {inGame && !showInventory && (
        <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-30 bg-black/50 text-gray-500 text-[10px] px-2 py-1 rounded" style={{ fontFamily: 'monospace' }}>
          TAB: 背包
        </div>
      )}
    </>
  );
}

export default App;
