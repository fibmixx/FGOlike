import { useGame } from './store/gameStore';
import { TitleScreen } from './ui/screens/TitleScreen';
import { StarterScreen } from './ui/screens/StarterScreen';
import { MapScreen } from './ui/screens/MapScreen';
import { BattleScreen } from './ui/screens/BattleScreen';
import { ResultScreen } from './ui/screens/ResultScreen';
import { CeRewardScreen } from './ui/screens/CeRewardScreen';
import { GachaScreen } from './ui/screens/GachaScreen';
import { RestScreen } from './ui/screens/RestScreen';
import { TreasureScreen } from './ui/screens/TreasureScreen';
import { SingularityClearScreen } from './ui/screens/SingularityClearScreen';
import { EndScreen } from './ui/screens/EndScreen';
import { Hud } from './ui/components/Hud';

export function App() {
  const { run } = useGame();
  if (!run) return <TitleScreen />;

  let screen;
  switch (run.phase) {
    case 'starter': screen = <StarterScreen run={run} />; break;
    case 'map': screen = <MapScreen run={run} />; break;
    case 'battle': screen = <BattleScreen run={run} />; break;
    case 'battleResult': screen = <ResultScreen run={run} />; break;
    case 'ceReward': screen = <CeRewardScreen run={run} />; break;
    case 'gacha': screen = <GachaScreen run={run} />; break;
    case 'rest': screen = <RestScreen run={run} />; break;
    case 'treasure': screen = <TreasureScreen run={run} />; break;
    case 'singularityClear': screen = <SingularityClearScreen run={run} />; break;
    case 'gameover':
    case 'victory': screen = <EndScreen run={run} />; break;
  }

  return (
    <div className="app">
      {run.phase !== 'starter' && <Hud run={run} />}
      <main className="screen">{screen}</main>
    </div>
  );
}
