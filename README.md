# FGOlike ✦ Grand Order Roguelike

Roguelike web inspirado en la estructura de [pokelike.xyz](https://pokelike.xyz) con el combate por cartas de comando de *Fate/Grand Order*.
Recorre las 7 Singularidades y el Templo de Salomón, recluta Servants en nodos de Invocación, sube de nivel, asciende y derrota a cada jefe.

> Fan game sin ánimo de lucro. *Fate/Grand Order* © TYPE-MOON / FGO PROJECT. No incluye arte oficial.

## Empezar

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests del motor (vitest)
npm run typecheck  # comprobación de tipos
npm run build      # build de producción en dist/
npx tsx scripts/simulate.ts 100   # simula 100 partidas con IA para balancear
```

Requiere Node 20.19+ (o 22+).

## Stack

| Capa | Elección | Por qué |
|---|---|---|
| Build | **Vite** | Arranque instantáneo, HMR, build estático para GitHub Pages |
| Lenguaje | **TypeScript** (strict) | Un juego con muchas reglas y datos se beneficia de tipos |
| UI | **React 19** | Pantallas de menú, mapa y combate = UI de estado, no un canvas |
| Estado | Store propio con `useSyncExternalStore` | 40 líneas, sin dependencias; cada acción clona la run → la muta → guarda |
| Persistencia | `localStorage` | Autoguardado tras cada acción; RNG con semilla guardado en la run |
| Tests | **Vitest** | El motor es TS puro, se testea sin navegador |

El **motor** (`src/game`) no importa nada de React: se puede testear, simular y, en el futuro, mover a un servidor o a otro framework.

## Estructura

```
src/
  game/                 Motor puro (sin React)
    types.ts            Tipos centrales (Servant, Battle, Run, Map…)
    constants.ts        Valores de FGO: cartas, clases, afinidades, curvas de nivel
    rng.ts              RNG con semilla (mulberry32)
    combat/
      damage.ts         Fórmulas de daño, ganancia de NP y estrellas
      battle.ts         Máquina de estados del combate (skills, cadenas, IA enemiga)
      factory.ts        Creación de unidades y encuentros por Singularidad
    map/generator.ts    Mapa por capas con bifurcaciones
    progression/
      leveling.ts       EXP, niveles, ascensión y desbloqueo de skills
      gacha.ts          Invocación ponderada por rareza
    run.ts              Flujo de la partida: nodos, recompensas, equipo
    save.ts             Guardado/carga
  data/                 Contenido (editable sin tocar lógica)
    servants.ts         23 Servants con skills y Noble Phantasms
    enemies.ts          Enemigos, élites y los 8 jefes
    singularities.ts    Las 8 Singularidades (pool de enemigos, jefe, tema)
    mysticCodes.ts      Skills del Master
  store/gameStore.ts    Puente motor ↔ React
  ui/
    components/         HUD, retratos, barras, panel de equipo, ayuda
    screens/            Título, starter, mapa, combate, gacha, descanso…
  styles/global.css
tests/                  Tests del motor
scripts/simulate.ts     Simulador headless para balanceo
```

## Mecánicas implementadas

- **Mapa**: 8 capas por Singularidad, bifurcaciones, nodos de Combate, Élite, Invocación, Descanso, Tesoro y Jefe. La capa 1 siempre ofrece una Invocación; la penúltima, un Descanso.
- **Gacha**: 3 Servants aleatorios (más 4★/5★ cuanto más avanzas), eliges 1. Duplicado → **NP +1**. Equipo máx. 6 (puedes liberar a uno).
- **Combate FGO**: mazo de 15 cartas (5 por Servant de primera línea), mano de 5, eliges 3. Bonus de primera carta, Buster/Arts/Quick Chain, **Mighty Chain**, **Brave Chain** con ataque Extra, estrellas críticas repartidas por clase, NP con Overcharge, ventaja de clase y atributo, carga de NP enemiga, oleadas, sustitución automática de caídos.
- **Skills** con cooldown y objetivo (propio / aliado / equipo / enemigo), **Mystic Code** (Uniforme de Caldea) y **Hechizos de Comando**.
- **Progresión**: EXP (la reserva recibe la mitad), topes 20/40/60/80/90; **Ascensión** con Cristales ◆ que desbloquea la 2ª y 3ª skill y luego mejora stats.
- **Roguelike**: la vida persiste entre combates; los caídos solo vuelven descansando, con tesoros o gastando un Hechizo de Comando.
- **QoL**: atajos de teclado (`1-5` cartas, `Q/W/E` NPs, `Enter` atacar, `Backspace` deshacer, `Esc` cancelar), indicador ▲/▼ de ventaja de clase en cada carta, % de crítico visible, previsualización de cadenas, autoguardado.

## Roadmap sugerido

1. Arte: retratos propios en `public/portraits/<id>.png` (el componente `Portrait` ya está aislado).
2. Animación secuencial de la cadena de cartas (el motor ya emite eventos `fx`).
3. **Craft Essences** como equipo/reliquias obtenidas en Tesoros y Élites.
4. Barras de vida múltiples (break bars) y fases para los jefes.
5. Más Servants por Singularidad (pool temática: p.ej. más probabilidad de Servants de Orleans en Orleans).
6. Bond / vínculos y sinergias de equipo (rasgos como "Romano", "Caballero de la Mesa Redonda").
7. Modo diario con semilla compartida y Ascensiones de dificultad tras ganar.

## Despliegue

El workflow `.github/workflows/deploy.yml` publica `dist/` en GitHub Pages en cada push a `main`
(activa *Settings → Pages → Source: GitHub Actions*).
