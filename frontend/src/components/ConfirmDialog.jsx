import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/** Подтверждение необратимого действия: модалка по центру, фон затемнён, Esc — отмена.
    Через портал в body: у блоков с .reveal есть transform, и position: fixed внутри них не держится за экран */
export default function ConfirmDialog({ title, text, confirmLabel, cancelLabel = "Не отменять", onConfirm, onClose }) {
  const cancelRef = useRef(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="ascrim" onClick={onClose}>
      <div className="adialog" role="alertdialog" aria-modal="true" aria-labelledby="adialog-title" onClick={(e) => e.stopPropagation()}>
        <h2 className="h3" id="adialog-title">{title}</h2>
        <p>{text}</p>
        <div className="adialog__actions">
          <button ref={cancelRef} className="btn btn--ghost btn--sm" type="button" onClick={onClose}>{cancelLabel}</button>
          <button className="btn btn--sm" type="button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
