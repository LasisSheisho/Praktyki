// ============================================================
// input.js - obsługa myszy na mapie (podgląd, stawianie i usuwanie budynków)
// ============================================================

// Zamienia pozycję myszy na współrzędne kafelka [x, y].
// Uwzględnia skalowanie canvasa (gdy na ekranie jest inny rozmiar niż w pikselach).
const pos = e => {
  const r = cv.getBoundingClientRect();
  return [Math.floor((e.clientX - r.left) * cv.width / r.width / S), Math.floor((e.clientY - r.top) * cv.height / r.height / S)];
};
// Ruch myszy: zapamiętujemy kafelek pod kursorem i rysujemy podgląd
cv.onmousemove = e => { hover = pos(e); draw(); };
// Mysz opuściła mapę: usuwamy podgląd
cv.onmouseleave = () => { hover = null; draw(); };
// Kliknięcie: usuwa budynek (bulldoze) albo stawia wybrany budynek
cv.onclick = e => {
  const [x, y] = pos(e);
  if (tool == 'bulldoze') {
    const i = occ()[y * N + x];                   // który budynek stoi na tym kafelku
    if (i >= 0) blds.splice(i, 1);                // usuwamy go z listy (bez zwrotu pieniędzy)
  } else if (canPlace(tool, x, y)) {
    blds.push({ t: tool, x, y });                 // dodajemy budynek
    money -= B[tool].c;                           // i pobieramy koszt
  } else return;                                  // nie da się postawić - nic nie robimy
  ui(); save();                                   // odświeżamy widok i zapisujemy na serwerze
};
