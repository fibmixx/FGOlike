import { ALL_CLASSES, CLASS_LABEL, classAffinity } from '@/game/constants';
import { ClassIcon } from './ClassIcon';

export function HelpPanel() {
  return (
    <div className="help">
      <section>
        <h3>Your mission</h3>
        <p>Restore Human Order by clearing the 7 Singularities and Solomon's Temple. Each Singularity is a map of branching paths with a boss at the top.</p>
      </section>
      <section>
        <h3>Map nodes</h3>
        <ul>
          <li><b>⚔ Battle</b> – common enemies in 1–3 waves. Grants EXP.</li>
          <li><b>☠ Elite</b> – an enemy Servant. More EXP, an Ascension Crystal ◆ and a Craft Essence.</li>
          <li><b>✦ Summon</b> – choose 1 of 3 Servants. A duplicate raises its NP level. Rarely, a Command Seal answers too.</li>
          <li><b>♨ Rest</b> – heal (and revive) the whole party, or train for EXP.</li>
          <li><b>◈ Treasure</b> – a random reward, often a Craft Essence.</li>
          <li><b>♛ Boss</b> – the Singularity's antagonist, with several HP bars (phases). Drops 2 ◆ and a Craft Essence.</li>
        </ul>
      </section>
      <section>
        <h3>Battle</h3>
        <ul>
          <li>Each turn you get 5 Command Cards from your 3 front-line Servants. Pick 3 (keys <kbd>1</kbd>–<kbd>5</kbd>) and press <kbd>Enter</kbd>.</li>
          <li><b>Buster</b> deals more damage · <b>Arts</b> charges NP · <b>Quick</b> generates critical stars.</li>
          <li>The <b>first card</b> gives its bonus to the whole chain. 3 of the same colour = <b>Chain</b> (Buster: bonus damage, Arts: +20% NP each, Quick: +10 stars); one of each = <b>Mighty Chain</b>.</li>
          <li>3 cards from the same Servant = <b>Brave Chain</b> → Extra Attack.</li>
          <li>At 100% NP, fire the <b>Noble Phantasm</b> (keys <kbd>Q</kbd> <kbd>W</kbd> <kbd>E</kbd>). Above 100% = Overcharge. Half of your NP (up to 50%) carries over to the next battle.</li>
          <li>Stars land on next turn's cards: each ★ = +10% critical chance.</li>
          <li>Enemies charge their special attack (◆ under their HP). Use evade, invincibility or charge reduction!</li>
          <li><b>Mystic Code</b> skills can be used <b>once per Singularity</b>. <b>Command Seals</b> never regenerate.</li>
          <li><kbd>Space</kbd> skips the turn animation.</li>
        </ul>
      </section>
      <section>
        <h3>Progression</h3>
        <ul>
          <li>Servants level up with EXP (the reserve gets half). Skill level grows with the Servant's level.</li>
          <li>Each ascension has a level cap (20/40/60/80/90). At the cap, spend ◆ to <b>Ascend</b>: unlocks the 2nd and 3rd skills, then boosts stats.</li>
          <li>HP does <b>not</b> recover between battles: plan your route through Rest nodes.</li>
          <li><b>Craft Essences</b> ✧: equip one per Servant in the Party screen.</li>
        </ul>
      </section>
      <section>
        <h3>Class affinity (attacker → defender)</h3>
        <div className="affinity-table">
          <table>
            <thead>
              <tr><th />{ALL_CLASSES.map((d) => <th key={d} title={CLASS_LABEL[d]}><ClassIcon cls={d} size={16} /></th>)}</tr>
            </thead>
            <tbody>
              {ALL_CLASSES.map((a) => (
                <tr key={a}>
                  <th title={CLASS_LABEL[a]}><ClassIcon cls={a} size={16} /></th>
                  {ALL_CLASSES.map((d) => {
                    const v = classAffinity(a, d);
                    return <td key={d} className={v > 1 ? 'adv' : v < 1 ? 'dis' : ''}>{v === 1 ? '' : `×${v}`}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
