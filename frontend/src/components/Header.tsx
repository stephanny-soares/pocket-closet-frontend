import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HeaderProps {
  title: string;
  transparent?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, transparent = false }) => {
  return (
    <View style={[styles.header, transparent && styles.headerTransparent]}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#4A90E2',
    width: '100%',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTransparent: {
    backgroundColor: 'transparent',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default Header;
