// ============================================================
// api.js - komunikacja z serwerem (api.php): logowanie, zapis, leaderboard
// ============================================================

// ---------- API / login ----------
// Wysyła do api.php akcję a (np. 'login') z danymi d (JSON) i zwraca odpowiedź jako obiekt
const api = (a, d) => fetch('api.php?action=' + a, { method: 'POST', body: JSON.stringify(d || {}) }).then(r => r.json());
// Wyświetla komunikat (np. błąd logowania) pod polami logowania; pusty tekst go czyści
const msg = t => document.getElementById('msg').textContent = t || '';

// Ustawia stan gry po zalogowaniu lub wczytaniu sesji (r = dane gracza z serwera)
function setUser(r) {
  user = r.username;
  money = Number(r.money);
  // Miasto zapisane jest jako tekst JSON; odrzucamy budynki, których typ już nie istnieje
  blds = JSON.parse(r.city || '[]').filter(b => B[b.t]);
  // Chowamy formularz logowania, pokazujemy nick i przycisk wylogowania
  document.getElementById('guest').hidden = true;
  document.getElementById('logged').hidden = false;
  document.getElementById('name').textContent = user;
  msg(); ui();
}

// Logowanie lub rejestracja (a = 'login' albo 'register') na podstawie pól Nick i Hasło
function auth(a) {
  api(a, { username: document.getElementById('u').value, password: document.getElementById('p').value })
    .then(r => r.error ? msg(r.error) : (setUser(r), lb()));   // błąd -> komunikat, sukces -> wczytaj gracza
}

// Wylogowanie: zapisujemy grę, kończymy sesję na serwerze i przywracamy stan gościa
function logout() {
  save();
  api('logout').then(() => {
    user = null; money = 1000; blds = [];
    document.getElementById('guest').hidden = false;
    document.getElementById('logged').hidden = true;
    ui();
  });
}

// Zapisuje pieniądze i miasto na serwerze (tylko dla zalogowanego gracza)
function save() {
  if (user) api('save', { money, city: JSON.stringify(blds) });
}

// Pobiera ranking 10 najbogatszych graczy i wyświetla go w panelu po lewej
function lb() {
  api('leaderboard').then(r => {
    const ol = document.getElementById('lb');
    ol.innerHTML = '';
    (Array.isArray(r) ? r : []).forEach(u => {    // gdy serwer zwróci błąd (nie tablicę), lista zostaje pusta
      const li = document.createElement('li');
      li.textContent = `${u.username} - $${u.money}`;
      ol.appendChild(li);
    });
  });
}
