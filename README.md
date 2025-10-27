# PocketCloset Frontend

Este repositorio contiene el frontend del PocketCloset, desarrollado con **React Native + Expo + TypeScript**, responsable de la interfaz de usuario y consumo de la API backend.

---

## Descripción del proyecto

PocketCloset es una aplicación móvil inteligente basada en Inteligencia Artificial (IA) que funciona como asistente personal de estilo y organización de ropa que permite al usuario:

- Registrar y organizar prendas en su armario digital
- Generar outfits automáticos según momento, clima y estilo
- Preparar listas de equipaje inteligentes (SmartPack)
- Interfaz moderna, fluida e intuitiva

Objetivo: facilitar la toma de decisiones sobre qué vestir y optimizar el uso del armario.

---

## Funcionalidades principales del frontend

- Registro y login de usuarios
- Visualización y gestión de prendas
- Planner de outfits inteligentes
- Modo viaje (SmartPack)

---

## Tecnologías

- React Native + Expo
- TypeScript
- Docker

---

## Estructura del proyecto
```plaintext
frontend/
├── app/                # Rutas de páginas iniciales (_layout, home, index, register)
├── assets/             # Imágenes e íconos
│   ├── icons/
│   └── images/
├── src/
│   ├── components/     # Componentes reutilizables (CheckBox, CustomInput, Header, etc.)
│   ├── constants/      # Constantes de la app (colores, etc.)
│   ├── logger/         # Manejo de logs y helpers
│   ├── pages/          # Pantallas de la aplicación (Home, LoginScreen, RegisterScreen)
│   └── utils/          # Funciones utilitarias (validation.js)
├── Dockerfile
├── package.json
├── package-lock.json
├── app.json
├── eslint.config.js
├── .dockerignore
└── .gitignore
```
---

## Configuración del entorno

### 1. Crear proyecto TypeScript
```bash
npx create-expo-app . --template expo-template-blank-typescript
```
### 2. Instalar dependencias
```bash
npm install
```
### 3. Ejecutar localmente
```bash
npx expo start --web
Web: http://localhost:8081
Android/iOS: Expo Go
```

### 4. Ejecutar con Docker
```bash
docker build -t pocketcloset-frontend .
docker run -it --rm -p 8081:8081 pocketcloset-frontend
```
### 5. Configuración de la API
```plaintext
Modificar la URL base de la API en src/services/api.ts:
export const API_URL = "http://localhost:5000/api";
```
---

## Enlaces relacionados

Backend del proyecto: https://github.com/stephanny-soares/pocket-closet-backend

---