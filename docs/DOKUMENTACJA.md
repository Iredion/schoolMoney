# Dokumentacja Techniczna – SchoolMoney

**Przedmiot:** Programowanie Aplikacji Webowych  
**Rok akademicki:** 2025/2026  

---

## Spis treści

1. [Cel i zakres projektu](#1-cel-i-zakres-projektu)
2. [Architektura systemu](#2-architektura-systemu)
3. [Backend – Spring Boot](#3-backend--spring-boot)
   - [Struktura modułów](#31-struktura-modułów)
   - [Modele danych](#32-modele-danych)
   - [Kontrolery REST](#33-kontrolery-rest)
   - [Autentykacja JWT](#34-autentykacja-jwt)
   - [WebSocket i Chat](#35-websocket-i-chat)
   - [Upload plików](#36-upload-plików)
4. [Frontend – React](#4-frontend--react)
   - [Struktura projektu](#41-struktura-projektu)
   - [Routing](#42-routing)
   - [Komunikacja z API](#43-komunikacja-z-api)
5. [Baza danych – MongoDB](#5-baza-danych--mongodb)
6. [Konteneryzacja – Docker](#6-konteneryzacja--docker)
7. [Przepływy biznesowe](#7-przepływy-biznesowe)
8. [Bezpieczeństwo](#8-bezpieczeństwo)

---

## 1. Cel i zakres projektu

**SchoolMoney** to aplikacja webowa wspierająca finansowe zarządzanie zbiorkami w klasach szkolnych. System eliminuje potrzebę obsługi gotówki poprzez wirtualny system kont i płatności.

### Główne funkcjonalności

| # | Funkcja | Rola |
|---|---------|------|
| 1 | Rejestracja i logowanie (JWT) | Wszyscy |
| 2 | Zarządzanie profilem użytkownika | Wszyscy |
| 3 | Dodawanie i edycja dzieci | Rodzic |
| 4 | Dołączanie dziecka do klasy (token zaproszenia) | Rodzic |
| 5 | Doładowanie wirtualnego konta | Rodzic |
| 6 | Płatność za zbiórkę w imieniu dziecka | Rodzic |
| 7 | Tworzenie klasy i generowanie tokenu zaproszenia | Skarbnik |
| 8 | Tworzenie i zarządzanie zbiorkami | Skarbnik |
| 9 | Wypłata środków ze zbiórki | Skarbnik |
| 10 | Zamknięcie zbiórki i zwrot środków | Skarbnik |
| 11 | Czat klasowy (broadcast) | Skarbnik + Rodzice |
| 12 | Czat prywatny (Skarbnik ↔ Rodzic) | Skarbnik + Rodzice |
| 13 | Panel administracyjny | Admin |
| 14 | Blokowanie kont i zbiórek | Admin |
| 15 | Raporty finansowe | Admin + Skarbnik |
| 16 | Upload logo zbiórki i awatarów | Skarbnik + Rodzice |

---

## 2. Architektura systemu

Projekt realizuje architekturę **Monolith Modular** – jednolita aplikacja backendowa z wyraźnym podziałem na warstwy odpowiedzialności.

```
┌──────────────────────────────────────────────────────────────┐
│  KLIENT (przeglądarka)                                       │
│  React SPA – React Router v7 + TailwindCSS v4 + Vite         │
│  Port: 3000 (Docker) / 5173 (dev)                            │
└───────────────────────┬──────────────────────────────────────┘
                        │ HTTP/REST  │  WebSocket (STOMP/SockJS)
┌───────────────────────▼──────────────────────────────────────┐
│  BACKEND (Spring Boot 3.5 / Java 21)                         │
│  Port: 8080                                                  │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────────────┐     │
│  │ REST API     │ │ WebSocket    │ │ Static Files      │     │
│  │ /api/**      │ │ /ws/**       │ │ /api/uploads/**   │     │
│  └──────┬───────┘ └──────┬───────┘ └───────────────────┘     │
│         │                │                                   │
│  ┌──────▼────────────────▼───────────────────────────────┐   │
│  │  Warstwa Serwisów (Logika biznesowa)                  │   │
│  │  AuthService | FundraiserService | TransactionService  │  │
│  │  ChildService | SchoolClassService | MessageService    │  │
│  └──────────────────────┬────────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼────────────────────────────────┐   │
│  │  Warstwa Repozytoriów (Spring Data MongoDB)           │   │
│  └──────────────────────┬────────────────────────────────┘   │
└─────────────────────────┼────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────┐
│  BAZA DANYCH (MongoDB 7.0)                                   │
│  Port: 27017                                                 │
│  Baza: schoolmoney_db                                        │
│  Kolekcje: users, classes, children,                         │
│            fundraisers, transactions, messages               │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Backend – Spring Boot

### 3.1 Struktura modułów

```
com.schoolmoney/
├── SchoolmoneyApplication.java   # Punkt startowy aplikacji
├── config/
│   ├── AuthInterceptor.java      # Weryfikacja JWT w każdym żądaniu
│   ├── WebConfig.java            # CORS, ścieżki chronione, upload
│   └── WebSocketConfig.java      # Konfiguracja STOMP/SockJS
├── controller/
│   ├── AuthController.java       # POST /api/auth/{register,login}
│   ├── UserController.java       # GET/PUT /api/users/me
│   ├── ChildController.java      # CRUD /api/children
│   ├── SchoolClassController.java# CRUD /api/classes
│   ├── FundraiserController.java # CRUD /api/fundraisers
│   ├── TransactionController.java# POST /api/transactions/{deposit,pay,withdraw,refund}
│   ├── ChatController.java       # WebSocket /app/chat.{class,private}
│   ├── AdminController.java      # GET/PATCH /api/admin/**
│   ├── MessageHistoryController.java # Historia czatu
│   └── FileUploadController.java # POST /api/upload
├── dto/                          # Obiekty żądań i odpowiedzi API
├── model/
│   ├── User.java
│   ├── SchoolClass.java
│   ├── Child.java
│   ├── Fundraiser.java
│   ├── Transaction.java
│   ├── Message.java
│   └── enums/
│       ├── Role.java             # ROLE_PARENT, ROLE_TREASURER, ROLE_ADMIN
│       ├── FundraiserStatus.java # ACTIVE, CLOSED
│       └── TransactionType.java  # DEPOSIT, PAYMENT, WITHDRAWAL, REFUND
├── repository/                   # Interfejsy Spring Data MongoDB
├── service/                      # Logika biznesowa
└── util/                         # JwtUtil
```

### 3.2 Modele danych

#### User
```java
@Document(collection = "users")
public class User {
    String id;
    @Indexed(unique = true) String email;
    @JsonIgnore String password;        // Hasło bcrypt, ukryte w JSON
    String firstName, lastName;
    String avatarUrl;
    Role role;                          // ROLE_PARENT / ROLE_TREASURER / ROLE_ADMIN
    @Indexed(unique = true) String virtualAccountNumber;
    BigDecimal balance;                 // Saldo wirtualne, domyślnie 0.00
    boolean isBlocked;
}
```

#### Fundraiser
```java
@Document(collection = "fundraisers")
public class Fundraiser {
    String id, classId, creatorId;
    String title, description, logoUrl;
    LocalDate startDate, endDate;
    BigDecimal amountPerChild;
    @Indexed(unique = true) String virtualAccountNumber;
    BigDecimal balance;
    FundraiserStatus status;            // ACTIVE / CLOSED
    List<String> receiptUrls;
    boolean isBlocked, isPublic;
}
```

#### Transaction
```java
@Document(collection = "transactions")
public class Transaction {
    String id;
    String fromAccountNumber, toAccountNumber;
    BigDecimal amount;
    TransactionType type;               // DEPOSIT/PAYMENT/WITHDRAWAL/REFUND
    String fundraiserId, classId, childId, payerId;
    Instant timestamp;
}
```

### 3.3 Kontrolery REST

#### Autentykacja (`/api/auth`)

| Metoda | Ścieżka | Ciało żądania | Odpowiedź |
|--------|---------|--------------|-----------|
| POST | `/register` | `{ email, password, firstName, lastName }` | `User` |
| POST | `/login` | `{ email, password }` | `{ token, user }` |

#### Użytkownicy (`/api/users`)

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/me` | Dane zalogowanego użytkownika |
| PUT | `/me` | Aktualizacja profilu |
| GET | `/` | Lista wszystkich użytkowników (skrócona) |

#### Dzieci (`/api/children`)

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| POST | `/` | Dodaj dziecko |
| GET | `/` | Lista moich dzieci |
| PUT | `/{id}` | Edytuj dziecko |
| DELETE | `/{id}` | Usuń dziecko |
| POST | `/{id}/join/{token}` | Dołącz do klasy przez token |
| POST | `/{id}/leave-class` | Opuść klasę |
| GET | `/class/{classId}` | Dzieci w klasie |

#### Klasy (`/api/classes`)

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| POST | `/` | Utwórz klasę (Skarbnik) |
| GET | `/my` | Moje klasy |
| GET | `/token/{token}` | Wyszukaj klasę po tokenie |

#### Zbiórki (`/api/fundraisers`)

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| POST | `/` | Utwórz zbiórkę (Skarbnik) |
| GET | `/class/{classId}` | Zbiórki klasy |
| PATCH | `/{id}/receipt` | Dodaj paragon |
| PATCH | `/{id}/close` | Zamknij zbiórkę |

#### Transakcje (`/api/transactions`)

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| POST | `/deposit` | Doładuj konto (Rodzic) |
| POST | `/pay` | Zapłać za dziecko (Rodzic) |
| POST | `/withdraw` | Wypłać ze zbiórki (Skarbnik) |
| POST | `/refund/{fundraiserId}/{childId}` | Zwrot płatności (Skarbnik) |
| GET | `/fundraiser/{id}` | Raport zbiórki |
| GET | `/class/{id}` | Raport klasy |

#### Admin (`/api/admin`) – tylko `ROLE_ADMIN`

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/users` | Wszyscy użytkownicy |
| GET | `/treasurers` | Wszyscy skarbnicy |
| PATCH | `/users/{id}/block` | Blokuj/odblokuj konto |
| GET | `/fundraisers` | Wszystkie zbiórki |
| PATCH | `/fundraisers/{id}/block` | Blokuj/odblokuj zbiórkę |
| GET | `/reports/fundraiser/{id}` | Raport finansowy zbiórki |
| GET | `/reports/class/{id}` | Raport finansowy klasy |
| GET | `/classes` | Wszystkie klasy |
| GET | `/children` | Wszystkie dzieci |

### 3.4 Autentykacja JWT

Przepływ autentykacji:

```
1. Klient → POST /api/auth/login { email, password }
2. Backend weryfikuje hasło (BCrypt)
3. Backend generuje token JWT (HS256, 24h)
4. Klient przechowuje token (localStorage)
5. Klient → nagłówek Authorization: Bearer <token>
6. AuthInterceptor weryfikuje token i ustawia userId w atrybutach żądania
```

Konfiguracja JWT (`application.yaml`):
```yaml
jwt:
  secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
  expirationMs: 86400000   # 24 godziny
```

Ścieżki wyłączone spod interceptora:
- `GET /api/auth/**`
- `GET /api/uploads/**`

### 3.5 WebSocket i Chat

Konfiguracja STOMP over WebSocket:

- **Endpoint SockJS:** `/ws` (z fallbackiem HTTP)
- **Prefix wiadomości:** `/app`
- **Broker topic (klasowy):** `/topic/class/{classId}`
- **Broker user (prywatny):** `/user/{userId}/queue/messages`

Typy wiadomości:

```json
// Wiadomość klasowa
{ "classId": "...", "content": "Tekst wiadomości" }

// Wiadomość prywatna
{ "receiverId": "...", "content": "Tekst wiadomości" }
```

### 3.6 Upload plików

- **Endpoint:** `POST /api/upload`
- **Maksymalny rozmiar pliku:** 5 MB
- **Maksymalny rozmiar żądania:** 10 MB
- **Lokalizacja plików:** katalog `uploads/` (mapowany na `/api/uploads/**`)
- W środowisku Docker pliki są przechowywane w woluminie `uploads_data`

---

## 4. Frontend – React

### 4.1 Struktura projektu

```
frontend/schoolMoney/
├── app/
│   ├── root.tsx           # Główny komponent aplikacji
│   ├── routes.ts          # Konfiguracja tras React Router
│   └── routes/            # Komponenty poszczególnych stron
├── public/                # Zasoby statyczne (favicon, etc.)
├── package.json           # Zależności npm
├── vite.config.ts         # Konfiguracja Vite + proxy
├── react-router.config.ts # Konfiguracja React Router
├── tsconfig.json          # Konfiguracja TypeScript
└── Dockerfile             # Obraz Dockera
```

### 4.2 Routing

Aplikacja używa **React Router v7** w trybie SPA. Proxy deweloperskie w `vite.config.ts`:

```typescript
server: {
  proxy: {
    "/api": { target: "http://localhost:8080", changeOrigin: true },
    "/ws":  { target: "http://localhost:8080", ws: true, changeOrigin: true }
  }
}
```

### 4.3 Komunikacja z API

- Żądania HTTP: natywny `fetch` API z nagłówkiem `Authorization: Bearer <token>`
- WebSocket: biblioteka `@stomp/stompjs` z fallbackiem `sockjs-client`

---

## 5. Baza danych – MongoDB

Szczegółowy schemat kolekcji – patrz [docs/db/README_db.md](db/README_db.md).

### Strategia wirtualnych kont

Każdy użytkownik i każda zbiórka otrzymuje unikalny numer wirtualnego konta (`virtualAccountNumber`) w formacie:
- Użytkownik: `SM-PAREN-NNNNNN` / `SM-TREAS-NNNNNN` / `SM-ADMIN-NNNNNN`
- Zbiórka: `SM-FUND-NNNNNN`

Płatności realizowane są przez zmianę sald (pola `balance`) w dokumentach, bez zewnętrznych systemów bankowych.

---

## 6. Konteneryzacja – Docker

### Obrazy

| Serwis | Obraz bazowy | Obraz wynikowy |
|--------|-------------|----------------|
| MongoDB | `mongo:7.0` | bez zmian |
| Backend | `eclipse-temurin:21-jdk-alpine` → `eclipse-temurin:21-jre-alpine` | ~180 MB |
| Frontend | `node:20-alpine` | ~120 MB |

### Backend Dockerfile – etapy

```dockerfile
# Etap 1: Budowanie JAR (JDK pełne)
FROM eclipse-temurin:21-jdk-alpine AS builder
# → ./gradlew bootJar

# Etap 2: Obraz produkcyjny (JRE minimalne)
FROM eclipse-temurin:21-jre-alpine AS runtime
# → tylko skopiowany JAR + użytkownik spring (non-root)
```

### Frontend Dockerfile – etapy

```dockerfile
# Etap 1: Zależności deweloperskie (npm ci)
# Etap 2: Zależności produkcyjne (npm ci --omit=dev)
# Etap 3: Build (npm run build)
# Etap 4: Produkcja (tylko build/ + node_modules)
```

### Kolejność uruchamiania (compose.yaml)

```
mongodb (health check) → backend → frontend
```

Zdrowie MongoDB sprawdzane jest przez `mongosh --eval "db.adminCommand('ping')"`.

---

## 7. Przepływy biznesowe

### Rejestracja i dołączenie do klasy (Rodzic)

```
1. Rodzic rejestruje konto → /api/auth/register
2. Logowanie → /api/auth/login → JWT token
3. Dodanie dziecka → POST /api/children
4. Skarbnik udostępnia token klasy (np. TOKEN-3A-2025)
5. Rodzic dołącza dziecko → POST /api/children/{id}/join/{token}
```

### Płatność za zbiórkę (Rodzic)

```
1. Rodzic doładowuje konto → POST /api/transactions/deposit
2. Wyświetlenie dostępnych zbiórek klasy → GET /api/fundraisers/class/{id}
3. Płatność za dziecko → POST /api/transactions/pay
   { childId, fundraiserId, amount }
4. Saldo rodzica maleje, saldo zbiórki rośnie
```

### Wypłata i zamknięcie zbiórki (Skarbnik)

```
1. Skarbnik wypłaca środki → POST /api/transactions/withdraw
   { fundraiserId, amount }
2. Saldo zbiórki maleje, środki trafiają do Skarbnika
3. Zamknięcie zbiórki → PATCH /api/fundraisers/{id}/close
4. Opcjonalnie: zwrot dla dzieci które zapłaciły
   → POST /api/transactions/refund/{fundraiserId}/{childId}
```

---

## 8. Bezpieczeństwo

| Mechanizm | Implementacja |
|-----------|--------------|
| Autentykacja | JWT HS256, ważność 24h |
| Weryfikacja uprawnień | `AuthInterceptor` – każde żądanie `/api/**` (poza auth i uploads) |
| Hasła | BCrypt (Spring Security BCryptPasswordEncoder) |
| CORS | Skonfigurowany w `WebConfig` – `allowedOrigins("*")` (dev) |
| Blokowanie kont | Flaga `isBlocked` w kolekcji `users` |
| Uprawnienia admina | Weryfikacja roli `ROLE_ADMIN` w `AdminController` |
| Docker non-root | Kontenery uruchamiane jako użytkownicy `spring` / `app` |

> **Uwaga:** Konfiguracja CORS `allowedOrigins("*")` jest przeznaczona wyłącznie dla środowiska deweloperskiego. Na produkcji należy ograniczyć dozwolone domeny.
