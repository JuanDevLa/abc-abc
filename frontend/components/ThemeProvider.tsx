"use client";

/**
 * ThemeProvider simple — sin next-themes.
 * El tema se controla exclusivamente por ruta:
 *   "/" → dark, todo lo demás → light.
 * El atributo data-theme se setea en RouteThemeForcer y en el <head> script del layout.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
