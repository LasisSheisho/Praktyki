<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
mysqli_report(MYSQLI_REPORT_OFF);

$db = new mysqli('localhost', 'root', '', 'citygrid');
if ($db->connect_error) { echo json_encode(['error' => 'Brak połączenia z bazą (' . $db->connect_error . '). Czy MySQL działa i zaimportowano database.sql?']); exit; }
if (!$db->query('SELECT 1 FROM users LIMIT 1')) { echo json_encode(['error' => 'Brak tabeli users. Zaimportuj database.sql w phpMyAdmin.']); exit; }

$in = json_decode(file_get_contents('php://input'), true) ?: [];
$action = $_GET['action'] ?? '';

function out($d) { echo json_encode($d); exit; }

function userData($db, $id) {
    $s = $db->prepare('SELECT username, money, city FROM users WHERE id=?');
    $s->bind_param('i', $id);
    $s->execute();
    return $s->get_result()->fetch_assoc();
}

if ($action == 'register') {
    $u = trim($in['username'] ?? '');
    $p = $in['password'] ?? '';
    if (strlen($u) < 3 || strlen($u) > 30 || strlen($p) < 3) out(['error' => 'Nick i hasło: min. 3 znaki']);
    $h = password_hash($p, PASSWORD_DEFAULT);
    $s = $db->prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    $s->bind_param('ss', $u, $h);
    if (!$s->execute()) out(['error' => 'Taki nick już istnieje']);
    $_SESSION['id'] = $db->insert_id;
    out(userData($db, $_SESSION['id']));
}

if ($action == 'login') {
    $u = trim($in['username'] ?? '');
    $p = $in['password'] ?? '';
    $s = $db->prepare('SELECT id, password FROM users WHERE username=?');
    $s->bind_param('s', $u);
    $s->execute();
    $row = $s->get_result()->fetch_assoc();
    if (!$row || !password_verify($p, $row['password'])) out(['error' => 'Zły nick lub hasło']);
    $_SESSION['id'] = $row['id'];
    out(userData($db, $row['id']));
}

if ($action == 'logout') {
    session_destroy();
    out(['ok' => true]);
}

if ($action == 'me') {
    if (isset($_SESSION['id'])) out(userData($db, $_SESSION['id']));
    out(['guest' => true]);
}

if ($action == 'save') {
    if (!isset($_SESSION['id'])) out(['error' => 'Nie zalogowany']);
    $money = max(0, (int)($in['money'] ?? 0));
    $city = substr((string)($in['city'] ?? '[]'), 0, 100000);
    $s = $db->prepare('UPDATE users SET money=?, city=? WHERE id=?');
    $s->bind_param('isi', $money, $city, $_SESSION['id']);
    $s->execute();
    out(['ok' => true]);
}

if ($action == 'leaderboard') {
    $r = $db->query('SELECT username, money FROM users ORDER BY money DESC LIMIT 10');
    out($r->fetch_all(MYSQLI_ASSOC));
}

out(['error' => 'Nieznana akcja']);
