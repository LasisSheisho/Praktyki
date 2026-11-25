// ============================================================
// main.js - uruchomienie gry (ładowany jako ostatni)
// ============================================================

// ---------- start ----------
// Co 3 sekundy: dodajemy przychód do pieniędzy, odświeżamy widok i zapisujemy grę
setInterval(() => { money += Math.round(calc().income); ui(); save(); }, 3000);
// Co 5 sekund odświeżamy leaderboard
setInterval(lb, 5000);
// Sprawdzamy, czy gracz ma już aktywną sesję na serwerze (jeśli tak, wczytujemy jego miasto)
api('me').then(r => { if (r.username) setUser(r); });
// Pierwsze narysowanie rankingu i mapy
lb();
ui();
