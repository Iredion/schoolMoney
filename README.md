# SchoolMoney 🏫💰

> **Aplikacja webowa do zarządzania zbiórkami klasowymi** – projekt zaliczeniowy na przedmiot *Programowanie Aplikacji Webowych*, rok akademicki 2025/2026.

---

## Spis treści

1. [Opis projektu](#opis-projektu)
2. [Architektura systemu](#architektura-systemu)
3. [Stos technologiczny](#stos-technologiczny)
4. [Struktura repozytorium](#struktura-repozytorium)
5. [Szybki start (Docker)](#szybki-start-docker)
6. [Instalacja lokalna (bez Dockera)](#instalacja-lokalna-bez-dockera)
7. [Zmienne środowiskowe](#zmienne-środowiskowe)
8. [API – przegląd endpointów](#api--przegląd-endpointów)
9. [WebSocket / Chat](#websocket--chat)
10. [Role użytkowników](#role-użytkowników)
11. [Dane testowe](#dane-testowe)
12. [Autorzy](#autorzy)

---

## Opis projektu

**SchoolMoney** to aplikacja webowa typu SPA + REST API, która umożliwia klasom szkolnym prowadzenie wirtualnych zbiórek pieniężnych. System obsługuje trzy rodzaje użytkowników:

- **Rodzic** – wpłaca środki, zapisuje dzieci do klasy, płaci za zbiórki
- **Skarbnik** – tworzy klasy i zbiórki, zarządza finansami, wypłaca środki
- **Administrator** – zarządza użytkownikami i zbiorkami z poziomu panelu admina

Aplikacja oferuje ponadto **czat klasowy i prywatny** w czasie rzeczywistym (WebSocket/STOMP).

---

## Architektura systemu

```
┌─────────────────────────────────────────────────────────┐
│                    WARSTWA DOSTĘPU                       │
│  React SPA (React Router v7 + TailwindCSS v4)           │
│  → proxy /api/* i /ws/* → backend:8080                  │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP/REST + WebSocket (STOMP)
┌───────────────────────▼─────────────────────────────────┐
│                WARSTWA BIZNESOWA                         │
│  Spring Boot 3.5 (Java 21)                              │
│  ├── AuthController   (JWT, rejestracja/logowanie)      │
│  ├── UserController   (profil, lista użytkowników)      │
│  ├── ChildController  (zarządzanie dziećmi)             │
│  ├── SchoolClassController (klasy, tokeny zaproszeń)   │
│  ├── FundraiserController  (zbiórki)                    │
│  ├── TransactionController (wpłaty, wypłaty, zwroty)   │
│  ├── ChatController   (WebSocket – STOMP)               │
│  ├── AdminController  (panel admina)                    │
│  └── FileUploadController (upload plików)              │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                WARSTWA DANYCH                            │
│  MongoDB 7.0                                             │
│  Kolekcje: users, classes, children,                    │
│            fundraisers, transactions, messages          │
└─────────────────────────────────────────────────────────┘
```

---

## Stos technologiczny

| Warstwa | Technologia | Wersja |
|---------|-------------|--------|
| Frontend | React + React Router | 7.16 |
| Frontend CSS | TailwindCSS | 4.x |
| Frontend bundler | Vite | 8.x |
| Backend | Spring Boot | 3.5.14 |
| Backend język | Java | 21 |
| Backend build | Gradle | 8.x |
| Baza danych | MongoDB | 7.0 |
| Autentykacja | JWT (jjwt) | 0.11.5 |
| Real-time | WebSocket + STOMP | – |
| Konteneryzacja | Docker + Docker Compose | – |

---

## Struktura repozytorium

```
SchoolMoney/
├── backend/                    # Aplikacja Spring Boot
│   ├── src/main/java/com/schoolmoney/
│   │   ├── config/             # Konfiguracja CORS, JWT, WebSocket
│   │   ├── controller/         # Kontrolery REST i WebSocket
│   │   ├── dto/                # Obiekty transferu danych
│   │   ├── model/              # Encje MongoDB
│   │   ├── repository/         # Repozytoria Spring Data
│   │   ├── service/            # Logika biznesowa
│   │   └── util/               # Narzędzia (JWT util)
│   ├── src/main/resources/
│   │   └── application.yaml    # Konfiguracja aplikacji
│   ├── Dockerfile              # Obraz Dockera backendu
│   └── compose.yaml            # Docker Compose (całość projektu)
│
├── frontend/schoolMoney/       # Aplikacja React
│   ├── app/                    # Strony i komponenty React Router
│   ├── public/                 # Zasoby statyczne
│   ├── Dockerfile              # Obraz Dockera frontendu
│   └── vite.config.ts          # Konfiguracja Vite + proxy
│
├── docs/                       # Dokumentacja projektu
│   ├── db/
│   │   ├── seed.js             # Skrypt seedujący MongoDB
│   │   └── README_db.md        # Dokumentacja bazy danych
│   ├── INSTALL.md              # Instrukcja instalacji
│   └── DOKUMENTACJA.md         # Pełna dokumentacja projektu
│
└── README.md                   # Ten plik
```

---

## Szybki start (Docker)

### Wymagania wstępne

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 24.x
- Git

### Kroki

```bash
# 1. Sklonuj repozytorium
git clone <adres-repozytorium> SchoolMoney
cd SchoolMoney

# 2. Uruchom wszystkie usługi
docker compose -f backend/compose.yaml up --build -d

# 3. Załaduj dane testowe (opcjonalnie)
docker exec -i schoolmoney-mongo mongosh \
  -u admin -p admin \
  --authenticationDatabase admin \
  schoolmoney_db < docs/db/seed.js

# 4. Otwórz aplikację
#    Frontend: http://localhost:3000
#    Backend API: http://localhost:8080
#    MongoDB: mongodb://admin:admin@localhost:27017
```

### Zatrzymanie

```bash
docker compose -f backend/compose.yaml down
# Z usunięciem woluminów (reset danych):
docker compose -f backend/compose.yaml down -v
```

---

## Instalacja lokalna (bez Dockera)

Szczegółowa instrukcja – patrz [docs/INSTALL.md](docs/INSTALL.md).

---

## Zmienne środowiskowe

### Backend

| Zmienna | Domyślna | Opis |
|---------|----------|------|
| `MONGO_URI` | `mongodb://admin:admin@localhost:27017/schoolmoney_db?authSource=admin` | URI MongoDB |
| `JWT_SECRET` | (w `application.yaml`) | Sekret do podpisywania tokenów JWT |
| `JWT_EXPIRATION_MS` | `86400000` (24h) | Czas życia tokenu JWT |

### Frontend

| Zmienna | Domyślna | Opis |
|---------|----------|------|
| `NODE_ENV` | `development` | Tryb pracy aplikacji |
| `BACKEND_URL` | `http://localhost:8080` | Adres backendu (produkcja) |

---

## API – przegląd endpointów

Wszystkie endpointy REST wymagają nagłówka `Authorization: Bearer <token>` z wyjątkiem `/api/auth/**`.

| Metoda | Endpoint | Opis | Rola |
|--------|----------|------|------|
| POST | `/api/auth/register` | Rejestracja | Publiczny |
| POST | `/api/auth/login` | Logowanie | Publiczny |
| GET | `/api/users/me` | Aktualny użytkownik | Zalogowany |
| PUT | `/api/users/me` | Aktualizacja profilu | Zalogowany |
| POST | `/api/children` | Dodanie dziecka | Rodzic |
| GET | `/api/children` | Lista dzieci | Rodzic |
| POST | `/api/children/{id}/join/{token}` | Dołączenie do klasy | Rodzic |
| POST | `/api/classes` | Stworzenie klasy | Skarbnik |
| GET | `/api/classes/my` | Moje klasy | Skarbnik |
| GET | `/api/classes/token/{token}` | Klasa po tokenie | Rodzic |
| POST | `/api/fundraisers` | Stworzenie zbiórki | Skarbnik |
| GET | `/api/fundraisers/class/{classId}` | Zbiórki klasy | Zalogowany |
| POST | `/api/transactions/deposit` | Doładowanie konta | Rodzic |
| POST | `/api/transactions/pay` | Płatność za dziecko | Rodzic |
| POST | `/api/transactions/withdraw` | Wypłata ze zbiórki | Skarbnik |
| GET | `/api/admin/users` | Lista użytkowników | Admin |
| PATCH | `/api/admin/users/{id}/block` | Blokowanie konta | Admin |
| GET | `/api/admin/fundraisers` | Wszystkie zbiórki | Admin |

---

## WebSocket / Chat

Aplikacja używa protokołu **STOMP over WebSocket**.

- **Endpoint połączenia:** `ws://localhost:8080/ws` (SockJS fallback)
- **Kanał klasowy:** `/topic/class/{classId}`
- **Wiadomości prywatne:** `/user/queue/messages`
- **Wysyłanie (klasa):** `/app/chat.class` + `{ classId, content }`
- **Wysyłanie (prywatne):** `/app/chat.private` + `{ receiverId, content }`

---

## Role użytkowników

| Rola | Enum | Możliwości |
|------|------|------------|
| Rodzic | `ROLE_PARENT` | Zarządzanie dziećmi, wpłaty, płatności za zbiórki, czat |
| Skarbnik | `ROLE_TREASURER` | Tworzenie klas i zbiórek, wypłaty, zarządzanie rachunkami |
| Administrator | `ROLE_ADMIN` | Pełny dostęp, blokowanie kont i zbiórek, raporty globalne |

---

## Dane testowe

Po uruchomieniu skryptu `docs/db/seed.js` dostępne są konta testowe (hasło dla wszystkich: `password123`):

| Rola | E-mail |
|------|--------|
| Admin | `admin@schoolmoney.pl` |
| Skarbnik | `skarbnik@schoolmoney.pl` |
| Rodzic | `rodzic1@schoolmoney.pl` |
| Rodzic | `rodzic2@schoolmoney.pl` |
| Rodzic (zablokowany) | `rodzic3@schoolmoney.pl` |

---

## Autorzy

Projekt wykonany w ramach przedmiotu **Programowanie Aplikacji Webowych**, rok akademicki 2025/2026.