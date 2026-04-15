import { useCallback, useEffect, useState } from 'react';

export type AppRoute = 'home' | 'search' | 'admin' | 'login' | 'session';

const HOME_PATH = '/';
const SEARCH_PATH = '/quizzes';
const ADMIN_PATH = '/admin';
const LOGIN_PATH = '/login';
const SESSION_PATH = '/sessions';

export function routeFromPathname(pathname: string): AppRoute {
  if (pathname === ADMIN_PATH) {
    return 'admin';
  }

  if (pathname === LOGIN_PATH) {
    return 'login';
  }

  if (pathname === SEARCH_PATH || pathname.startsWith(`${SEARCH_PATH}/`)) {
    return 'search';
  }

  if (pathname === SESSION_PATH || pathname.startsWith(`${SESSION_PATH}/`)) {
    return 'session';
  }

  return 'home';
}

export function useAppRoute() {
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window === 'undefined' ? 'home' : routeFromPathname(window.location.pathname),
  );

  const syncPath = useCallback((targetPath: string, replace = false) => {
    if (typeof window !== 'undefined') {
      if (replace) {
        window.history.replaceState({}, '', targetPath);
      } else {
        window.history.pushState({}, '', targetPath);
      }
    }

    setRoute(routeFromPathname(targetPath));
  }, []);

  const syncRoute = useCallback(
    (nextRoute: AppRoute, replace = false) => {
      const targetPath =
        nextRoute === 'admin'
          ? ADMIN_PATH
          : nextRoute === 'login'
            ? LOGIN_PATH
            : nextRoute === 'search'
              ? SEARCH_PATH
              : nextRoute === 'session'
                ? SESSION_PATH
                : HOME_PATH;

      syncPath(targetPath, replace);
    },
    [syncPath],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const onPopState = () => {
      setRoute(routeFromPathname(window.location.pathname));
    };

    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  return { route, setRoute, syncRoute, syncPath };
}
