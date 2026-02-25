import { useState, useEffect, createContext, useContext } from 'react';

// ─── Settings Context ────────────────────────────────────────────
export interface PortalSettings {
    contentFilter: boolean;
    profanityFilter: boolean;
    showOnline: boolean;
    readReceipts: boolean;
    notifications_likes: boolean;
    notifications_comments: boolean;
    notifications_messages: boolean;
    notifications_mentions: boolean;
    notifications_community: boolean;
    darkMode: boolean;
    compactMode: boolean;
    autoplayVideos: boolean;
    showAge: boolean;
    showMobile: boolean;
}

export const DEFAULT_SETTINGS: PortalSettings = {
    contentFilter: true,
    profanityFilter: true,
    showOnline: true,
    readReceipts: true,
    notifications_likes: true,
    notifications_comments: true,
    notifications_messages: true,
    notifications_mentions: true,
    notifications_community: true,
    darkMode: true,
    compactMode: false,
    autoplayVideos: true,
    showAge: false,
    showMobile: false,
};

interface SettingsContextType {
    settings: PortalSettings;
    updateSetting: (key: keyof PortalSettings, value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType>({
    settings: DEFAULT_SETTINGS,
    updateSetting: () => { },
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<PortalSettings>(() => {
        try {
            const saved = localStorage.getItem('portalSettings');
            return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
        } catch {
            return DEFAULT_SETTINGS;
        }
    });

    const updateSetting = (key: keyof PortalSettings, value: boolean) => {
        const updated = { ...settings, [key]: value };
        setSettings(updated);
        localStorage.setItem('portalSettings', JSON.stringify(updated));
    };

    // Apply settings effects
    useEffect(() => {
        // Dark mode / compact mode via CSS vars on root
        document.documentElement.classList.toggle('compact-mode', settings.compactMode);
        document.documentElement.classList.toggle('light-mode', !settings.darkMode);
    }, [settings.compactMode, settings.darkMode]);

    return (
        <SettingsContext.Provider value={{ settings, updateSetting }}>
            {children}
        </SettingsContext.Provider>
    );
}
