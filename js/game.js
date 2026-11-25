// ============================================================
// game.js - stan gry i logika (stawianie budynków, wyliczanie zarobków)
// ============================================================

// Stan gry:
// blds  - lista postawionych budynków, każdy to { t: typ, x, y } (lewy górny róg)
// money - ilość pieniędzy gracza
// tool  - aktualnie wybrane narzędzie (typ budynku albo 'bulldoze')
// user  - nick zalogowanego gracza (null = gość)
// hover - kafelek pod myszką [x, y] albo null
let blds = [], money = 1000, tool = 'road', user = null, hover = null;

// Zwraca listę kafelków [x, y], które zajmie budynek typu t postawiony w (x, y)
const tiles = (t, x, y) => {
  const r = [];
  for (let j = 0; j < B[t].h; j++) for (let i = 0; i < B[t].w; i++) r.push([x + i, y + j]);
  return r;
};
// Czy współrzędne mieszczą się w mapie
const inMap = (x, y) => x >= 0 && y >= 0 && x < N && y < N;

// Tworzy tablicę zajętości: dla każdego kafelka numer budynku, który go zajmuje (albo -1 gdy pusto)
function occ() {
  const o = new Array(N * N).fill(-1);
  blds.forEach((b, i) => tiles(b.t, b.x, b.y).forEach(([x, y]) => o[y * N + x] = i));
  return o;
}

// Czy można postawić budynek t w (x, y)
function canPlace(t, x, y) {
  if (money < B[t].c) return false;               // za mało pieniędzy
  const o = occ(), ts = tiles(t, x, y);
  for (const [a, b] of ts) {
    // nie wolno: poza mapą, na wodzie (kod 3), ani na zajętym kafelku
    if (!inMap(a, b) || MAP[b * N + a] == 3 || o[b * N + a] >= 0) return false;
  }
  if (B[t].cat == 'pump') {   // musi stać obok wody
    // sprawdzamy 4 sąsiadów każdego kafelka budynku, czy któryś jest wodą
    return ts.some(([a, b]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) =>
      inMap(a + dx, b + dy) && MAP[(b + dy) * N + a + dx] == 3));
  }
  return true;
}

// ---------- obliczenia ----------
// Liczy statystyki miasta i przychód na jeden cykl (3 sekundy)
function calc() {
  const o = occ(), p = [...Array(N * N + blds.length).keys()];
  // Union-Find: łączymy w grupy drogi i budynki, które są ze sobą połączone drogami.
  // f(a) - znajduje przedstawiciela grupy, uni(a, b) - łączy dwie grupy
  const f = a => p[a] == a ? a : (p[a] = f(p[a]));
  const uni = (a, b) => { p[f(a)] = f(b); };
  // Czy na kafelku (x, y) stoi droga
  const isRoad = (x, y) => inMap(x, y) && o[y * N + x] >= 0 && blds[o[y * N + x]].t == 'road';

  blds.forEach((b, i) => {
    if (b.t == 'road') {
      // droga łączy się z drogą po prawej i poniżej (sąsiedzi w drugą stronę dodadzą się sami)
      [[1, 0], [0, 1]].forEach(([dx, dy]) => { if (isRoad(b.x + dx, b.y + dy)) uni(b.y * N + b.x, (b.y + dy) * N + b.x + dx); });
    } else if (B[b.t].cat == 'house' || B[b.t].cat == 'work') {
      // dom/praca łączy się z każdą drogą stykającą się z jego bokiem
      tiles(b.t, b.x, b.y).forEach(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        if (isRoad(x + dx, y + dy)) uni(N * N + i, (y + dy) * N + x + dx);
      }));
    }
  });

  // has(b, k) - czy budynek b stoi (choć jednym kafelkiem) na terenie o kodzie k
  const has = (b, k) => tiles(b.t, b.x, b.y).some(([x, y]) => MAP[y * N + x] == k);
  // groups - grupy połączone drogami: ile ludzi, ile miejsc pracy i lista zakładów pracy
  const groups = {};
  let people = 0, jobs = 0, water = 0, power = 0, demand = 0;

  blds.forEach((b, i) => {
    const d = B[b.t];
    // zwraca (i tworzy w razie potrzeby) grupę, do której należy ten budynek
    const grp = () => groups[f(N * N + i)] = groups[f(N * N + i)] || { people: 0, jobs: 0, w: [] };
    if (d.cat == 'house') {
      const v = d.v * (has(b, 2) ? 0.9 : 1);      // bagno: -10% mieszkańców
      people += v; demand += d.v / 4;             // każdy budynek zwiększa zapotrzebowanie na wodę i prąd
      grp().people += v;
    } else if (d.cat == 'work') {
      // mnożnik zarobków: bagno -10%, ciemna trawa +10%
      const m = (has(b, 2) ? 0.9 : 1) * (has(b, 1) ? 1.1 : 1);
      jobs += d.v; demand += d.v / 4;
      const g = grp();
      g.jobs += d.v; g.w.push([d.v, m]);
    } else if (d.cat == 'pump') {
      water += d.v * (has(b, 4) ? 1.1 : 1);       // piasek: +10% wody
    } else if (d.cat == 'power') {
      power += d.v;
    }
  });

  // Przychód: w każdej grupie pracuje tyle osób, ile jest ludzi lub miejsc pracy (mniejsza wartość),
  // a ich zarobek dzielimy między zakłady proporcjonalnie do liczby miejsc pracy
  let income = 0;
  Object.values(groups).forEach(g => {
    const workers = Math.min(g.people, g.jobs);
    g.w.forEach(([v, m]) => income += workers * (v / g.jobs) * 5 * m);
  });
  // Wydajność (0-1): ograniczona przez niedobór wody lub prądu
  const eff = demand ? Math.min(1, water / demand, power / demand) : 1;
  return { income: income * eff, people, jobs, water, power, demand };
}
