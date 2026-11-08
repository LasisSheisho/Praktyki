
(function () {
  'use strict';

  const SIZE = 128;
  const GRASS = 0, WATER = 1, SAND = 2;

  const MAPS = [
    {
      id: 'jeziora',
      name: 'Kraina Jezior',
      description: 'Kilka jezior rozsianych po okolicy.',
      image: '33.png',
    },
    {
      id: 'rzeka',
      name: 'Dolina Rzeki',
      description: 'Kręta rzeka przecina mapę z północy na południe.',
      image: '22.png',
    },
    {
      id: 'wybrzeze',
      name: 'Wybrzeże',
      description: 'Morze wzdłuż zachodniej krawędzi mapy.',
      image: '11.png',
    },
  ];




//ai---------------------------
  function create(root, options) {
    const opts = options || {};
    let selected = null;

    const screen = document.createElement('main');
    screen.className = 'start';
    screen.innerHTML = `
      <h1>City<span>Grid</span></h1>
      <h2 class="section">Wybierz mapę</h2>
      <div class="maps" role="group" aria-label="Dostępne mapy"></div>
      <div class="actions">
        <button class="btn" id="start-btn" disabled>Rozpocznij grę</button>
      </div>
    `;

    const mapsEl = screen.querySelector('.maps');
    const startBtn = screen.querySelector('#start-btn');
    const cards = [];

    MAPS.forEach((def) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'map-card';
      card.setAttribute('aria-pressed', 'false');
      card.innerHTML = `
        <img class="preview" alt="Podgląd mapy ${def.name}" src="${def.image}">
        <h3>${def.name}</h3>
        <p>${def.description}</p>
      `;

      const img = card.querySelector('img');
      const entry = { def, terrain: null };
      const load = () => { entry.terrain = readTerrain(img); };
      if (img.complete && img.naturalWidth) load();
      else img.addEventListener('load', load);

      card.addEventListener('click', () => select(entry, card));
      card.addEventListener('dblclick', () => { select(entry, card); start(); });

      mapsEl.appendChild(card);
      cards.push(card);
    });

    function select(entry, card) {
      selected = entry;
      cards.forEach((c) => c.setAttribute('aria-pressed', String(c === card)));
      startBtn.disabled = false;
    }

    function start() {
      if (!selected) return;
      if (typeof opts.onStart === 'function') {
        opts.onStart({
          mapId: selected.def.id,
          name: selected.def.name,
          image: selected.def.image,
          size: SIZE,
          terrain: selected.terrain, // 0 trawa, 1 woda, 2 piasek (lub null)
        });
      }
    }

    startBtn.addEventListener('click', start);
    root.appendChild(screen);
  }

  window.StartScreen = { create, SIZE, MAPS };
})();
//ai---------------------------koniec