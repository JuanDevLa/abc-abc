"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Fuerza dark en "/" y light en todas las demás rutas.
 * Manipula el DOM directamente — sin dependencia de next-themes.
 */
export function RouteThemeForcer() {
    const pathname = usePathname();

    useEffect(() => {
        const theme = pathname === "/" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", theme);
    }, [pathname]);

    return null;
}
