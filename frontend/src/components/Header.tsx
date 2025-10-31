import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../constants/colors';

interface HeaderProps {
  title: string;
  transparent?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, transparent = false }) => {
  if (transparent) {
    return (
      <View style={styles.headerTransparent}>
        <Text style={styles.title}>{title}</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={colors.gradient as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header as any}
    >
      <Text style={styles.title}>{title}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  } as any,
  headerTransparent: {
    backgroundColor: 'transparent',
    width: '100%',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default Header;
