# ============================================================
# SchoolMoney Frontend – Dockerfile
# Technologia: React Router v7 / Node 20 / Vite
# Multi-stage build: zależności deweloperskie → build → produkcja
# ============================================================

# ---------- Etap 1: zależności deweloperskie (do budowania) ----------
FROM node:20-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci

# ---------- Etap 2: zależności produkcyjne (tylko runtime) ----------
FROM node:20-alpine AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev

# ---------- Etap 3: budowanie aplikacji ----------
FROM node:20-alpine AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

# ---------- Etap 4: obraz produkcyjny ----------
FROM node:20-alpine

# Tworzenie użytkownika bez uprawnień root
RUN addgroup -S app && adduser -S app -G app

COPY ./package.json package-lock.json /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build

WORKDIR /app

USER app

EXPOSE 3000

CMD ["npm", "run", "start"]