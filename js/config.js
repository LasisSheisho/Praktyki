// ============================================================
// config.js - stałe gry, definicje budynków i generowanie mapy
// ============================================================

// N = liczba kafelków w jednym boku mapy (mapa ma 32x32)
// S = rozmiar jednego kafelka w pikselach
const N = 32, S = 20;

// Nazwy typów terenu. Numer w tablicy = kod terenu używany w MAP:
// 0 trawa, 1 ciemna trawa, 2 bagno, 3 woda, 4 piasek
const TN = ['grass', 'darkgrass', 'swamp', 'water', 'sand'];
// Kolory rysowania poszczególnych typów terenu (w tej samej kolejności co TN)
const TC = ['#7c5', '#385', '#675', '#37a', '#ec8'];

// Budynki podzielone na kategorie, każda ma 4 poziomy (tiery).
// Format wpisu: [nazwa, szerokość, wysokość, koszt, wartość]
// "wartość" znaczy co innego zależnie od kategorii:
//   house = liczba mieszkańców, work = liczba miejsc pracy,
//   pump = produkcja wody, power = produkcja prądu
const TIERS = {
  house: { col: '#c55', list: [['Dom', 1, 1, 100, 4], ['Dom wielorodzinny', 2, 2, 400, 20], ['Blok', 2, 3, 1500, 80], ['Wieżowiec', 3, 4, 6000, 400]] },
  work:  { col: '#58c', list: [['Warsztat', 1, 1, 150, 4], ['Sklep', 2, 2, 500, 20], ['Fabryka', 3, 3, 2000, 80], ['Biurowiec', 3, 4, 8000, 400]] },
  pump:  { col: '#4cf', list: [['Studnia', 1, 1, 100, 10], ['Pompa', 2, 1, 300, 40], ['Stacja wody', 2, 2, 1000, 150], ['Wodociągi', 3, 2, 4000, 600]] },
  power: { col: '#fc3', list: [['Generator', 1, 1, 100, 10], ['Elektrownia', 2, 2, 300, 40], ['Elektr. gazowa', 2, 3, 1000, 150], ['Reaktor', 3, 3, 4000, 600]] }
};

// B = słownik wszystkich budynków, kluczem jest identyfikator (np. 'road', 'house1').
// Pola: cat = kategoria, n = nazwa, w/h = rozmiar, c = koszt, v = wartość, col = kolor
// Droga jest definiowana ręcznie, bo nie ma tierów ani wartości.
const B = { road: { cat: 'road', n: 'Droga', w: 1, h: 1, c: 10, col: '#555' } };
// Z listy TIERS tworzymy wpisy house1..house4, work1..work4 itd.
Object.keys(TIERS).forEach(cat => TIERS[cat].list.forEach((a, i) => {
  B[cat + (i + 1)] = { cat, n: a[0], w: a[1], h: a[2], c: a[3], v: a[4], col: TIERS[cat].col };
}));

// ---------- stała mapa ----------
//ai
// Zwraca kod terenu (0-4) dla kafelka o współrzędnych x, y.
// Mapa jest wyliczana wzorami, więc jest zawsze taka sama.
function terr(x, y) {
  // d(a, b, r) - czy punkt (x, y) leży w kole o środku (a, b) i promieniu r
  const d = (a, b, r) => (x - a) ** 2 + (y - b) ** 2 < r * r;
  // wat(a, b) - czy punkt (a, b) jest wodą: elipsa (jezioro) lub koło (staw)
  const wat = (a, b) => (a - 24) ** 2 / 36 + (b - 7) ** 2 / 16 < 1 || (a - 6) ** 2 + (b - 25) ** 2 < 9;
  if (wat(x, y)) return 3;                       // woda
  // Sprawdzamy, czy w odległości do 2 kafelków jest woda (tam może być piasek)
  let near = false;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (wat(x + dx, y + dy)) near = true;
  if (near && ((y >= 8 && x >= 18) || x <= 5)) return 4;   // piasek tylko na części brzegów
  if (d(12, 12, 3) || d(26, 22, 3.5) || d(4, 8, 2.5)) return 2;   // bagna
  if (d(14, 22, 4) || d(10, 4, 3) || d(28, 28, 3)) return 1;      // ciemna trawa
  return 0;                                      // zwykła trawa
}
// MAP to jednowymiarowa tablica N*N z kodami terenu; kafelek (x, y) jest pod indeksem y*N + x
const MAP = [];
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) MAP[y * N + x] = terr(x, y);
//koniec ai
