# PocketCloset Frontend

Este repositorio contiene el frontend del PocketCloset, desarrollado con **React Native + Expo + TypeScript**, responsable de la interfaz de usuario y consumo de la API backend.

---

## Descripción del proyecto

PocketCloset es una aplicación inteligente de organización de ropa, que actúa como un asistente personal de estilo. Permite:

- Gestionar el armario digital del usuario
- Planificar outfits diarios
- Crear outfits para eventos, ocasiones o viajes
- Clasificar automáticamente prendas y sugerir combinaciones según clima y ocasión
- Crear maletas de viaje automáticamente usando prendas y outfits ya guardados, con opción de editar

Objetivo: facilitar la toma de decisiones diarias sobre qué vestir y optimizar el uso de la ropa existente.

---

## Funcionalidades principales del frontend

- Registro y login de usuarios
- Visualización y gestión de prendas
  * Ver detalles: categoría, color, estación
  * Filtros: categoría, color, estación, ocasión, clima
  * Marcar prendas como favoritas
- Planner de outfits inteligentes
  * Sugerencias automáticas de IA: 3 looks por día en la pantalla principal
  * Crear outfits personalizados por evento o por prenda
  * Guardar, editar o eliminar combinaciones
- Modo viaje (SmartPack)
  * IA crea la maleta automáticamente, el usuario puede editar y usar looks ya guardados
  * Agregar o remover prendas manualmente
  * Guardar diferentes listas de viaje

---

## Tecnologías

- Framework: React Native + Expo
- Lenguaje: TypeScript
- Librerías principales:
  * @react-navigation/native & @react-navigation/bottom-tabs
  * Axios
  * Expo modules:
    - expo-image-picker
    - expo-linear-gradient
    - expo-location
    - expo-secure-store
    - expo-auth-session
  * NativeWind & TailwindCSS
  * Otras librerías: React Native Calendars, Toast Message, Gesture Handler
- Testing / Dev: Jest, @testing-library/react-native, ESLint, TypeScript

---

## Estructura del proyecto
```plaintext
frontend/
├── README.md
├── .env.example
├── package.json
├── tsconfig.json
├── app/              # Rutas (autenticación y áreas protegidas)
├── src/              # Componentes, hooks, servicios y utilidades
├── assets/           # Fuentes, iconos e imágenes
├── styles/           # Estilos globales
├── test/             # Tests
└── config/           # Configuración (Babel, ESLint, Tailwind, Metro, Jest)
```
---

## Configuración del entorno

### 1. Instalar dependencias
```bash
npm install
```
### 2. Ejecutar localmente
```bash
npx expo start --web

Web: http://localhost:8081
Android/iOS: Expo Go
```

### 3. Variables de entorno

- Copiar .env.example para .env y completar con tus credenciales locales.

### 4. Configuración de la API
```plaintext
Modificar la URL base de la API en src/services/api.ts:

export const API_URL = "http://localhost:5000/api";
```
---

## Enlaces relacionados

Backend del proyecto: https://github.com/stephanny-soares/pocket-closet-backend

---