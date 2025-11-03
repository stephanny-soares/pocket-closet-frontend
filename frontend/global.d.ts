// global.d.ts
// Declaración ligera de "document" para proyectos Expo/React Native con soporte web.
// No activa toda la lib "dom", solo tipa las propiedades más usadas.

interface MinimalDocument {
  createElement: (tagName: string) => any;
  head?: {
    appendChild: (el: any) => void;
  };
}

declare const document: MinimalDocument;
