export function HelpPanel() {
  return (
    <div className="help">
      <section>
        <h3>La misión</h3>
        <p>Restaura la Orden Humana atravesando las 7 Singularidades y el Templo de Salomón. Cada Singularidad es un mapa con caminos que se bifurcan y un Jefe al final.</p>
      </section>
      <section>
        <h3>Nodos del mapa</h3>
        <ul>
          <li><b>⚔ Combate</b> – enemigos comunes en 1–3 oleadas. Dan EXP.</li>
          <li><b>☠ Élite</b> – un Servant enemigo. Más EXP y un Cristal de Ascensión ◆ garantizado.</li>
          <li><b>✦ Invocación</b> – elige 1 de 3 Servants. Si ya lo tienes, sube su NP de nivel.</li>
          <li><b>♨ Descanso</b> – cura (y revive) a todo el equipo, o entrena para ganar EXP.</li>
          <li><b>◈ Tesoro</b> – recompensa aleatoria.</li>
          <li><b>♛ Jefe</b> – el antagonista de la Singularidad. Da 2 ◆.</li>
        </ul>
      </section>
      <section>
        <h3>Combate</h3>
        <ul>
          <li>Cada turno recibes 5 cartas de comando de tus 3 Servants en primera línea. Elige 3 (teclas <kbd>1</kbd>–<kbd>5</kbd>) y pulsa <kbd>Enter</kbd>.</li>
          <li><b>Buster</b> (rojo) hace más daño · <b>Arts</b> (azul) carga NP · <b>Quick</b> (verde) genera estrellas críticas.</li>
          <li>La <b>primera carta</b> da un bonus a toda la cadena. 3 del mismo color = <b>Chain</b>; una de cada = <b>Mighty Chain</b>.</li>
          <li>3 cartas del mismo Servant = <b>Brave Chain</b> → ataque Extra.</li>
          <li>Con NP al 100% puedes lanzar su <b>Noble Phantasm</b> (teclas <kbd>Q</kbd> <kbd>W</kbd> <kbd>E</kbd>). Más de 100% = Overcharge.</li>
          <li>Las estrellas se reparten en las cartas del turno siguiente: cada ★ = +10% de crítico.</li>
          <li>Ventaja de clase: Saber › Lancer › Archer › Saber · Rider › Caster › Assassin › Rider. Berserker hace y recibe x2.</li>
          <li>Los enemigos cargan su ataque especial (puntos ◆ bajo su vida). ¡Usa evasión, invencibilidad o reduce su carga!</li>
        </ul>
      </section>
      <section>
        <h3>Progresión</h3>
        <ul>
          <li>Los Servants suben de nivel con la EXP de los combates (la reserva recibe la mitad).</li>
          <li>Cada ascensión tiene un nivel máximo (20/40/60/80/90). Al alcanzarlo, gasta ◆ para <b>Ascender</b>: desbloquea la 2ª y 3ª habilidad y después mejora sus stats.</li>
          <li>La vida <b>no se recupera</b> entre combates: planifica tu ruta pasando por Descansos.</li>
          <li><b>Hechizos de Comando ✠</b> (3): en combate dan NP +100% o curan por completo; fuera, reviven a un Servant. Recuperas 1 por Singularidad.</li>
        </ul>
      </section>
    </div>
  );
}
