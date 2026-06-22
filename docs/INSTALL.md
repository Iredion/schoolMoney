# Instrukcja instalacji i uruchomienia – SchoolMoney

## Metoda 1: Docker Compose (zalecana) ⭐

### Wymagania

| Narzędzie | Minimalna wersja | Link |
|-----------|-----------------|------|
| Docker Desktop | 24.x | https://www.docker.com/products/docker-desktop/ |
| Git | dowolna | https://git-scm.com/ |

### Kroki instalacji

```bash
# 1. Sklonuj repozytorium
git clone <adres-repozytorium> SchoolMoney
cd SchoolMoney

# 2. Zbuduj i uruchom wszystkie kontenery (pierwsza instalacja może trwać kilka minut)
docker compose -f backend/compose.yaml up --build -d
```

Po zakończeniu dostępne są usługi:

| Usługa | Adres |
|--------|-------|
| Frontend (React) | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| MongoDB | mongodb://localhost:27017 |

### Weryfikacja

```bash
# Sprawdzenie statusu kontenerów
docker compose -f backend/compose.yaml ps

# Logi backendu
docker compose -f backend/compose.yaml logs backend -f

# Logi frontendu
docker compose -f backend/compose.yaml logs frontend -f
```

### Ładowanie danych testowych

```bash
docker exec -i schoolmoney-mongo mongosh \
  -u admin -p admin \
  --authenticationDatabase admin \
  schoolmoney_db < docs/db/seed.js
```

### Zatrzymanie

```bash
# Zatrzymanie (dane zachowane)
docker compose -f backend/compose.yaml down

# Zatrzymanie + usunięcie danych (pełny reset)
docker compose -f backend/compose.yaml down -v
```

---

## Metoda 2: Uruchomienie lokalne (bez Dockera)

### Wymagania

| Narzędzie | Minimalna wersja | Link |
|-----------|-----------------|------|
| Java JDK | 21 | https://adoptium.net/ |
| Node.js | 20.x | https://nodejs.org/ |
| MongoDB | 7.0 | https://www.mongodb.com/try/download/community |
| Git | dowolna | https://git-scm.com/ |

### Krok 1: Baza danych MongoDB

Upewnij się, że MongoDB działa lokalnie. Domyślna konfiguracja:
- Host: `localhost`
- Port: `27017`
- Użytkownik: `admin`
- Hasło: `admin`
- Baza: `schoolmoney_db`

Aby uruchomić tylko MongoDB przez Docker:

```bash
docker run -d \
  --name schoolmoney-mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=admin \
  mongo:7.0
```

### Krok 2: Uruchomienie backendu

```bash
cd backend

# Windows
gradlew.bat bootRun

# Linux / macOS
./gradlew bootRun
```

Backend będzie dostępny pod adresem: http://localhost:8080

> Plik konfiguracyjny: `backend/src/main/resources/application.yaml`

### Krok 3: Uruchomienie frontendu

```bash
cd frontend/schoolMoney

# Instalacja zależności (tylko przy pierwszym uruchomieniu)
npm install

# Tryb deweloperski z hot-reload
npm run dev
```

Frontend będzie dostępny pod adresem: http://localhost:5173

> Proxy API jest skonfigurowane w `vite.config.ts` – żądania `/api/*` i `/ws/*` są automatycznie przekierowane na `localhost:8080`.

### Krok 4: Dane testowe

```bash
mongosh -u admin -p admin \
  --authenticationDatabase admin \
  schoolmoney_db \
  docs/db/seed.js
```

---

## Rozwiązywanie problemów

### Problem: port już zajęty

Sprawdź, co używa danego portu:

```bash
# Windows PowerShell
netstat -ano | findstr :8080
netstat -ano | findstr :3000
netstat -ano | findstr :27017

# Linux / macOS
lsof -i :8080
```

### Problem: backend nie może połączyć się z MongoDB

Sprawdź, czy MongoDB działa i czy URI w `application.yaml` lub zmiennej `MONGO_URI` jest poprawne.

### Problem: błąd podczas budowania frontendu

```bash
cd frontend/schoolMoney
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Problem: błąd Gradle podczas budowania backendu

```bash
cd backend
./gradlew clean bootJar --no-daemon
```

---

## Wymagania sprzętowe (minimum)

| Zasób | Minimum |
|-------|---------|
| RAM | 4 GB (8 GB zalecane) |
| Miejsce na dysku | 3 GB (Docker images + dane) |
| CPU | 2 rdzenie |
