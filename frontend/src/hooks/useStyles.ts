import { Platform, StyleSheet } from 'react-native';
import React from 'react';

export const useResponsiveStyles = (mobileStyles: any, webStyles: any) => {
  if (Platform.OS === 'web') {
    return webStyles;
  }
  return mobileStyles;
};

// Hook para aplicar estilos globales en web
export const useWebGlobalStyles = () => {
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = `
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          background-color: #F9F9F9;
        }
        #root {
          width: 100%;
          height: 100%;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);
};
