import {useEffect, useState} from 'react';
const STORAGE_KEY = 'voltroute.workspace.theme';

function getInitialTheme(){
    try{
        const savedTheme = localStorage.getItem(STORAGE_KEY);

        if (savedTheme === 'light' || savedTheme === 'dark') {
            return savedTheme;
        }
    } catch {
        // Ignore localStorage errors
    }
    return 'light';
}

export default function useWorkspaceTheme() {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        }
        catch {
            // Ignore localStorage errors
        }
    }, [theme]);


    function toggleTheme() {
        setTheme((previousTheme) => previousTheme === 'light' ? 'dark' : 'light');
    }

    return { theme, toggleTheme, isDark: theme === 'dark' };    
}