import React, { createContext, useState, useContext, useEffect } from 'react';
        import AsyncStorage from '@react-native-async-storage/async-storage';
        import { lightTheme, darkTheme } from '../styles/theme';

        const ThemeContext = createContext();

        export const ThemeProvider = ({ children }) => {
          const [isDark, setIsDark] = useState(false);

          useEffect(() => {
            const loadTheme = async () => {
              const stored = await AsyncStorage.getItem('@theme_mode');
              if (stored !== null) setIsDark(stored === 'dark');
            };
            loadTheme();
          }, []);

          const toggleTheme = async () => {
            const newMode = !isDark;
            setIsDark(newMode);
            await AsyncStorage.setItem('@theme_mode', newMode ? 'dark' : 'light');
          };

          const theme = isDark ? darkTheme : lightTheme;

          return (
            <ThemeContext.Provider value={{ isDark, toggleTheme, theme }}>
              {children}
            </ThemeContext.Provider>
          );
        };

        export const useTheme = () => useContext(ThemeContext);
      