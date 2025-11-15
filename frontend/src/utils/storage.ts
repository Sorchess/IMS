export const saveToStorage = (key: string, value: any): void => {
    try {
        const serializedValue: string = JSON.stringify(value);
        localStorage.setItem(key, serializedValue);
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

export const getFromStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const item: string | null = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

export const removeFromStorage = (key: string): void => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Error removing to localStorage:', error);
    }
}