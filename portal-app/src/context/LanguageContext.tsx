import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type Language, translations, t as translate } from '../i18n/translations';

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: (section: keyof typeof translations, key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
    lang: 'en',
    setLang: () => { },
    t: () => '',
});

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Language>(() => {
        try {
            const saved = localStorage.getItem('pandaraSamaja_lang');
            return (saved === 'od' || saved === 'or' ? 'od' : 'en') as Language;
        } catch {
            return 'en';
        }
    });

    const setLang = useCallback((newLang: Language) => {
        setLangState(newLang);
        localStorage.setItem('pandaraSamaja_lang', newLang === 'od' ? 'or' : 'en');
        // Set html lang attribute
        document.documentElement.lang = newLang === 'od' ? 'or' : 'en';
    }, []);

    // Set initial html lang
    useEffect(() => {
        document.documentElement.lang = lang === 'od' ? 'or' : 'en';
    }, [lang]);

    const t = useCallback(
        (section: keyof typeof translations, key: string) => translate(section, key, lang),
        [lang]
    );

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
