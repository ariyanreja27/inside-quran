import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const isFirstMount = useRef(true);

  useLayoutEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    window.scrollTo({
      top: 0,
      left: 0,
    });
  }, [pathname]);

  return null;
}
