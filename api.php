<?php
// ============================================================
// api.php - serwer gry: logowanie, rejestracja, zapis i ranking
// Odpowiada zawsze w formacie JSON. Rodzaj operacji wybiera parametr ?action=...
// ============================================================

session_start();                                  // sesja PHP - tu pamiętamy, kto jest zalogowany
header('Content-Type: application/json; charset=utf-8');
mysqli_report(MYSQLI_REPORT_OFF);                 // błędy bazy zwracają false zamiast rzucać wyjątki

// Połączenie z bazą MySQL (host, użytkownik, hasło, nazwa bazy)
$db = new mysqli('localhost', 'root', '', 'citygrid');
// Jeśli nie ma połączenia lub brakuje tabeli, zwracamy czytelny błąd i kończymy
if ($db->connect_error) { echo json_encode(['error' => 'Brak połączenia z bazą (' . $db->connect_error . '). Czy MySQL działa i zaimportowano database.sql?']); exit; }
if (!$db->query('SELECT 1 FROM users LIMIT 1')) { echo json_encode(['error' => 'Brak tabeli users. Zaimportuj database.sql w phpMyAdmin.']); exit; }

// Dane wysłane z JavaScriptu (JSON w treści żądania) zamieniamy na tablicę
$in = json_decode(file_get_contents('php://input'), true) ?: [];
// Nazwa żądanej operacji, np. 'login'
$action = $_GET['action'] ?? '';

// Wysyła odpowiedź JSON i kończy działanie skryptu
function out($d) { echo json_encode($d); exit; }

// Pobiera z bazy nick, pieniądze i miasto gracza o danym id
function userData($db, $id) {
    $s = $db->prepare('SELECT username, money, city FROM users WHERE id=?');
    $s->bind_param('i', $id);
    $s->execute();
    return $s->get_result()->fetch_assoc();
}

// --- REJESTRACJA: tworzy nowe konto i od razu loguje ---
if ($action == 'register') {
    $u = trim($in['username'] ?? '');
    $p = $in['password'] ?? '';
    // walidacja długości nicku (3-30 znaków) i hasła (min. 3 znaki)
    if (strlen($u) < 3 || strlen($u) > 30 || strlen($p) < 3) out(['error' => 'Nick i hasło: min. 3 znaki']);
    $h = password_hash($p, PASSWORD_DEFAULT);     // hasło zapisujemy tylko w postaci hasha
    $s = $db->prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    $s->bind_param('ss', $u, $h);
    // insert się nie uda, jeśli nick już istnieje (kolumna jest UNIQUE)
    if (!$s->execute()) out(['error' => 'Taki nick już istnieje']);
    $_SESSION['id'] = $db->insert_id;             // zapamiętujemy w sesji id nowego gracza
    out(userData($db, $_SESSION['id']));
}

// --- LOGOWANIE: sprawdza nick i hasło ---
if ($action == 'login') {
    $u = trim($in['username'] ?? '');
    $p = $in['password'] ?? '';
    $s = $db->prepare('SELECT id, password FROM users WHERE username=?');
    $s->bind_param('s', $u);
    $s->execute();
    $row = $s->get_result()->fetch_assoc();
    // porównujemy podane hasło z hashem z bazy
    if (!$row || !password_verify($p, $row['password'])) out(['error' => 'Zły nick lub hasło']);
    $_SESSION['id'] = $row['id'];
    out(userData($db, $row['id']));
}

// --- WYLOGOWANIE: kasuje sesję ---
if ($action == 'logout') {
    session_destroy();
    out(['ok' => true]);
}

// --- ME: czy ktoś jest zalogowany? Jeśli tak, zwraca jego dane (wczytanie sesji po odświeżeniu strony) ---
if ($action == 'me') {
    if (isset($_SESSION['id'])) out(userData($db, $_SESSION['id']));
    out(['guest' => true]);
}

// --- ZAPIS: zapisuje pieniądze i miasto zalogowanego gracza ---
if ($action == 'save') {
    if (!isset($_SESSION['id'])) out(['error' => 'Nie zalogowany']);
    $money = max(0, (int)($in['money'] ?? 0));    // pieniądze jako liczba całkowita, nie mniej niż 0
    $city = substr((string)($in['city'] ?? '[]'), 0, 100000);   // miasto (JSON) przycięte do 100 000 znaków
    $s = $db->prepare('UPDATE users SET money=?, city=? WHERE id=?');
    $s->bind_param('isi', $money, $city, $_SESSION['id']);
    $s->execute();
    out(['ok' => true]);
}

// --- RANKING: 10 graczy z największą ilością pieniędzy ---
if ($action == 'leaderboard') {
    $r = $db->query('SELECT username, money FROM users ORDER BY money DESC LIMIT 10');
    out($r->fetch_all(MYSQLI_ASSOC));
}

// Jeśli żadna akcja nie pasowała
out(['error' => 'Nieznana akcja']);
