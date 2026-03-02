import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Resets the scroll position of the main scrolling container on route change.
 * Prevents pages from inheriting the scroll position of the previous page
 * when navigating forward or backward.
 */
export function ScrollToTop({ containerId = "main-scroll-container" }: { containerId?: string }) {
    const { pathname } = useLocation();
    const prevPathName = useRef(pathname);

    useEffect(() => {
        if (pathname !== prevPathName.current) {
            const el = document.getElementById(containerId);
            if (el) {
                el.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            }
            prevPathName.current = pathname;
        }
    }, [pathname, containerId]);

    return null;
}
