// ============================================================
// render.js - rysowanie mapy na canvasie i odświeżanie statystyk
// ============================================================

// Pobieramy element canvas i ustawiamy jego rozmiar (N kafelków po S pikseli)
const cv = document.getElementById('map');
cv.width = cv.height = N * S;
const ctx = cv.getContext('2d');

// Rysuje wypełniony prostokąt o rozmiarze w x h kafelków w pozycji (x, y).
// Parametr n (nazwa) nie jest używany, został dla czytelności wywołań.
function pic(n, x, y, w, h, col) {
  ctx.fillStyle = col;
  ctx.fillRect(x * S, y * S, w * S, h * S);
}

// Litery wypisywane na budynkach (po nich numer poziomu, np. D1, P3)
const LETTER = { house: 'D', work: 'P', pump: 'W', power: 'E' };

// Rysuje całą mapę: teren, budynki oraz podgląd stawiania pod myszką
function draw() {
  // 1. teren
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const k = MAP[y * N + x];
    pic(TN[k], x, y, 1, 1, TC[k]);
  }
  // 2. budynki (kolorowy prostokąt z obramowaniem i podpisem)
  blds.forEach(b => {
    pic(b.t, b.x, b.y, B[b.t].w, B[b.t].h, B[b.t].col);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(b.x * S, b.y * S, B[b.t].w * S, B[b.t].h * S);
    if (B[b.t].cat != 'road') {                   // drogi nie mają podpisu
      ctx.fillStyle = '#000';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(LETTER[B[b.t].cat] + b.t.slice(-1), (b.x + B[b.t].w / 2) * S, (b.y + B[b.t].h / 2) * S);
    }
  });
  // 3. podgląd: zielony, gdy można postawić budynek, czerwony gdy nie
  if (hover && tool != 'bulldoze') {
    ctx.fillStyle = canPlace(tool, hover[0], hover[1]) ? 'rgba(0,255,0,.45)' : 'rgba(255,0,0,.45)';
    tiles(tool, hover[0], hover[1]).forEach(([x, y]) => ctx.fillRect(x * S, y * S, S, S));
  }
}

// Odświeża panel ze statystykami (pieniądze, przychód, ludzie, woda, prąd) i przerysowuje mapę
function ui() {
  const s = calc();
  document.getElementById('stats').innerHTML =
    `Pieniądze: <b>$${money}</b><br>Przychód: +${Math.round(s.income)} / 3s<br>` +
    `Ludzie: ${Math.round(s.people)} (prace: ${s.jobs})<br>Woda: ${Math.round(s.water)} / ${Math.round(s.demand)}<br>Prąd: ${s.power} / ${Math.round(s.demand)}`;
  draw();
}
