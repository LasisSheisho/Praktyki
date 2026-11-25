//ai
// ============================================================
// toolbar.js - budowanie panelu z listą budynków po prawej stronie
// ============================================================

// ---------- panel budynków ----------
const tl = document.getElementById('tools');      // kontener na przyciski
// Nagłówki sekcji wyświetlane nad grupami przycisków
const heads = { road: 'Drogi', house: 'Dom', work: 'Praca', pump: 'Woda', power: 'Prąd' };
// Jednostki wyświetlane przy opisie budynku (ludzie, miejsca pracy, woda, prąd)
const unit = { house: 'os.', work: 'prac.', pump: 'wody', power: 'prądu' };
let lastCat = '';                                 // poprzednia kategoria - żeby wstawić nagłówek tylko raz
// Dla każdego budynku (plus przycisk 'bulldoze' na końcu) tworzymy przycisk
Object.keys(B).concat('bulldoze').forEach(t => {
  const cat = t == 'bulldoze' ? 'bulldoze' : B[t].cat;
  // Gdy zaczyna się nowa kategoria, dodajemy nagłówek
  if (cat != lastCat) {
    lastCat = cat;
    if (heads[cat]) {
      const h = document.createElement('div');
      h.textContent = heads[cat];
      h.style.cssText = 'margin:8px 0 3px;color:#fc3;font-weight:bold';
      tl.appendChild(h);
    }
  }
  const b = document.createElement('button');
  b.className = 'tool'; b.id = 't_' + t;
  const name = t == 'bulldoze' ? 'Usuń' : B[t].n;
  // Opis: rozmiar, koszt i (jeśli jest) wartość z jednostką
  const info = t == 'bulldoze' ? '' : ` ${B[t].w}x${B[t].h} - $${B[t].c}` + (B[t].v ? ` - ${B[t].v} ${unit[B[t].cat]}` : '');
  const col = t == 'bulldoze' ? '#a33' : B[t].col;
  // Przycisk = kolorowy kwadracik + nazwa + opis
  b.innerHTML = `<span style="width:18px;height:18px;flex:none;background:${col};border:1px solid #000"></span><span>${name}<br><small>${info}</small></span>`;
  // Po kliknięciu wybieramy to narzędzie i podświetlamy przycisk
  b.onclick = () => {
    tool = t;
    document.querySelectorAll('.tool').forEach(e => e.classList.remove('sel'));
    b.classList.add('sel');
  };
  tl.appendChild(b);
});
// Na start zaznaczona jest droga
document.getElementById('t_road').classList.add('sel');
//koniec ai
