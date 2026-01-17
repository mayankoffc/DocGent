
"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { translations, TranslationKey, translate as translateText } from '@/lib/translations';

type Language = 'en' | 'hi' | 'fr';

interface TranslationContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: TranslationKey, replacements?: Record<string, string>) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        const storedLang = localStorage.getItem('language') as Language | null;
        if (storedLang && translations[storedLang]) {
            setLanguageState(storedLang);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    const t = useCallback((key: TranslationKey, replacements?: Record<string, string>): string => {
        const langFile = translations[language] || translations['en'];
        const translation = langFile[key] || translations['en'][key];
        return translateText(translation, replacements);
    }, [language]);
    
    const value = { language, setLanguage, t };

    return (
        <TranslationContext.Provider value={value}>
            {children}
        </TranslationContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(TranslationContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a TranslationProvider');
    }
    return context;
};
