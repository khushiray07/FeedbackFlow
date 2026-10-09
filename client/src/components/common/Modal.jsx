import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ title, onClose, children }) {
  const panelRef = useRef(null);
  const previousFocus = useRef(null);
  useEffect(() => {
    previousFocus.current = document.activeElement;
    const app = document.getElementById('app-shell');
    if (app) app.inert = true;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector('input, textarea, select, button')?.focus();
    return () => { if (app) app.inert = false; document.body.style.overflow = priorOverflow; previousFocus.current?.focus(); };
  }, []);
  function onKeyDown(event) {
    if (event.key === 'Escape') { event.preventDefault(); onClose(); }
    if (event.key !== 'Tab') return;
    const focusable = [...panelRef.current.querySelectorAll('button, input, select, textarea, a[href]')].filter(element => !element.disabled);
    const first = focusable[0]; const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  return createPortal(<div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={panelRef} className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title" onKeyDown={onKeyDown}>
      <div className="modal-heading"><div><span className="eyebrow">SHARE YOUR IDEA</span><h2 id="modal-title">{title}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog">×</button></div>
      {children}
    </section>
  </div>, document.body);
}
