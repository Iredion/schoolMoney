# SchoolMoney – Dokumentacja Bazy Danych

## Technologia

- **Silnik:** MongoDB 7.0
- **Baza danych:** `schoolmoney_db`
- **Autentykacja:** użytkownik `admin` / hasło `admin` (tylko środowisko deweloperskie)
- **URI połączenia:** `mongodb://admin:admin@localhost:27017/schoolmoney_db?authSource=admin`

---

## Uruchamianie seedu (dane przykładowe)

### Wymagania
- Uruchomiony kontener MongoDB (patrz `compose.yaml` w katalogu głównym projektu)
- Narzędzie `mongosh` lub dostęp do kontenera przez Docker

### Przez Docker (zalecane)

```bash
docker exec -i schoolmoney-mongo mongosh \
  -u admin -p admin \
  --authenticationDatabase admin \
  schoolmoney_db \
  < docs/db/seed.js
```

### Lokalnie (mongosh zainstalowane w systemie)

```bash
mongosh -u admin -p admin \
  --authenticationDatabase admin \
  schoolmoney_db \
  docs/db/seed.js
```

> **Uwaga:** Skrypt `seed.js` usuwa i wypełnia od nowa wszystkie kolekcje. Nie uruchamiaj go na danych produkcyjnych.

---

## Schemat kolekcji

### `users`

Przechowuje wszystkich użytkowników systemu.

| Pole | Typ | Opis |
|------|-----|------|
| `_id` | ObjectId | Unikalny identyfikator |
| `email` | String (unique) | Adres e-mail (login) |
| `password` | String | Hasło bcrypt (ukryte w odpowiedziach API) |
| `firstName` | String | Imię |
| `lastName` | String | Nazwisko |
| `avatarUrl` | String / null | Ścieżka do awataru |
| `role` | Enum | `ROLE_PARENT`, `ROLE_TREASURER`, `ROLE_ADMIN` |
| `virtualAccountNumber` | String (unique) | Numer wirtualnego konta (format `SM-XXXX-NNNNNN`) |
| `balance` | Decimal128 | Saldo konta (domyślnie `0.00`) |
| `isBlocked` | Boolean | Czy konto jest zablokowane (domyślnie `false`) |

---

### `classes`

Klasy szkolne zarządzane przez skarbników.

| Pole | Typ | Opis |
|------|-----|------|
| `_id` | ObjectId | Unikalny identyfikator |
| `name` | String (unique) | Nazwa klasy |
| `treasurerId` | String | ID skarbnika (ref → `users._id`) |
| `inviteToken` | String | Token zaproszenia do klasy |

---

### `children`

Dzieci przypisane do rodziców i klas.

| Pole | Typ | Opis |
|------|-----|------|
| `_id` | ObjectId | Unikalny identyfikator |
| `firstName` | String | Imię dziecka |
| `lastName` | String | Nazwisko dziecka |
| `avatarUrl` | String / null | Ścieżka do awataru |
| `dateOfBirth` | Date | Data urodzenia |
| `parentId` | String | ID rodzica (ref → `users._id`) |
| `classId` | String / null | ID klasy (ref → `classes._id`), null jeśli nie przypisano |

---

### `fundraisers`

Zbiórki pieniężne tworzone przez skarbników w ramach klas.

| Pole | Typ | Opis |
|------|-----|------|
| `_id` | ObjectId | Unikalny identyfikator |
| `classId` | String | ID klasy (ref → `classes._id`) |
| `creatorId` | String | ID twórcy (ref → `users._id`) |
| `title` | String | Tytuł zbiórki |
| `description` | String | Opis zbiórki |
| `logoUrl` | String / null | URL logo |
| `startDate` | Date | Data rozpoczęcia |
| `endDate` | Date | Data zakończenia |
| `amountPerChild` | Decimal128 | Kwota wymagana od każdego dziecka |
| `virtualAccountNumber` | String (unique) | Numer wirtualnego konta zbiórki |
| `balance` | Decimal128 | Aktualne saldo zbiórki |
| `status` | Enum | `ACTIVE`, `CLOSED` |
| `receiptUrls` | Array\<String\> | Lista URL-i paragonów/rachunków |
| `isBlocked` | Boolean | Czy zbiórka jest zablokowana przez admina |
| `isPublic` | Boolean | Czy zbiórka jest widoczna publicznie |

---

### `transactions`

Historia wszystkich operacji finansowych.

| Pole | Typ | Opis |
|------|-----|------|
| `_id` | ObjectId | Unikalny identyfikator |
| `fromAccountNumber` | String | Numer konta źródłowego |
| `toAccountNumber` | String | Numer konta docelowego |
| `amount` | Decimal128 | Kwota transakcji |
| `type` | Enum | `DEPOSIT`, `PAYMENT`, `WITHDRAWAL`, `REFUND` |
| `fundraiserId` | String / null | Powiązana zbiórka (opcjonalne) |
| `classId` | String / null | Powiązana klasa (opcjonalne) |
| `childId` | String / null | Powiązane dziecko (opcjonalne) |
| `payerId` | String | ID płatnika (ref → `users._id`) |
| `timestamp` | Date | Data i czas transakcji |

---

### `messages`

Wiadomości czatu (klasowe i prywatne).

| Pole | Typ | Opis |
|------|-----|------|
| `_id` | ObjectId | Unikalny identyfikator |
| `senderId` | String | ID nadawcy (ref → `users._id`) |
| `receiverId` | String / null | ID odbiorcy (prywatna wiadomość), null = klasowa |
| `classId` | String / null | ID klasy (wiadomość klasowa), null = prywatna |
| `content` | String | Treść wiadomości |
| `timestamp` | Date | Data i czas wysłania |

---

## Indeksy

Indeksy tworzone automatycznie przez Spring Data MongoDB na podstawie adnotacji `@Indexed(unique = true)`:

| Kolekcja | Pole | Typ |
|----------|------|-----|
| `users` | `email` | Unique |
| `users` | `virtualAccountNumber` | Unique |
| `classes` | `name` | Unique |
| `fundraisers` | `virtualAccountNumber` | Unique |

---

## Konta testowe (po uruchomieniu seeda)

| Rola | E-mail | Hasło |
|------|--------|-------|
| Admin | `admin@schoolmoney.pl` | `password123` |
| Skarbnik | `skarbnik@schoolmoney.pl` | `password123` |
| Rodzic 1 | `rodzic1@schoolmoney.pl` | `password123` |
| Rodzic 2 | `rodzic2@schoolmoney.pl` | `password123` |
| Rodzic 3 (zablokowany) | `rodzic3@schoolmoney.pl` | `password123` |
