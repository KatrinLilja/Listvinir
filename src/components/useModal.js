import { useEffect, useRef } from 'react';

// Opens and closes a native <dialog> to match whether there is something to show.
export function useModal(show) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (show && !d.open) d.showModal();
    if (!show && d.open) d.close();
    if (show) d.scrollTop = 0;
  }, [show]);
  return ref;
}
