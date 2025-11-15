import {createContext, type ReactNode, useEffect, useState} from "react";
import {getFromStorage, saveToStorage} from "../utils/storage.ts";

interface ThemeContextProps {
    isDark: boolean;
    setIsDark: (isDark: boolean) => void;
}

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeContext = createContext<ThemeContextProps>({
    isDark: false,
    setIsDark: () => {},
});

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
    const [ isDark, setIsDark ] = useState(() => getFromStorage('theme', false));

    useEffect(() => {
        const html = document.documentElement;

        if (isDark) {
            html.setAttribute('data-theme', 'dark');
            html.classList.add('dark-mode');
            html.classList.remove('light-mode');
        } else {
            html.setAttribute('data-theme', 'light');
            html.classList.add('light-mode');
            html.classList.remove('dark-mode');
        }

        saveToStorage('theme', isDark);
    }, [isDark]);

    return (
        <ThemeContext.Provider value={{
            isDark,
            setIsDark
        }}>
            {children}
        </ThemeContext.Provider>
    );
}