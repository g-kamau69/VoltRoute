import {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
} from "react";

import { createPortal } from "react-dom";
import { X } from "lucide-react";

import "./GlassModal.css";

const CLOSE_DURATION = 260;

const ModalFooterContext = createContext(null);

export function GlassModalFooter({ children }) {
  const footerTarget = useContext(ModalFooterContext);

  if (!footerTarget) {
    return null;
  }

  return createPortal(
    <div className="vrgm-footer-actions">
      {children}
    </div>,
    footerTarget
  );
}

export default function GlassModal({
  children,
  onClose,
  title = "Details",
  subtitle = "",
  size = "lg",
  showFooter = true,
  dismissible = true,
}) {
  const dialogRef = useRef(null);
  const closingRef = useRef(false);
  const closeTimerRef = useRef(null);

  const [isClosing, setIsClosing] = useState(false);
  const [footerTarget, setFooterTarget] = useState(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;

    closingRef.current = false;

    if (!dialog.open) {
      dialog.showModal();
    }

    return () => {
      window.clearTimeout(closeTimerRef.current);

      if (dialog.open) {
        dialog.close();
      }

      if (
        previousFocus instanceof HTMLElement &&
        previousFocus.isConnected &&
        !previousFocus.disabled
      ) {
        previousFocus.focus();
      }
    };
  }, []);

  function startClosing(afterClose, force = false) {
    if (closingRef.current) return;
    if (!dismissible && !force) return;

    closingRef.current = true;

    const completeClose =
      typeof afterClose === "function"
        ? afterClose
        : onClose;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      completeClose();
      return;
    }

    setIsClosing(true);

    closeTimerRef.current = window.setTimeout(
      completeClose,
      CLOSE_DURATION
    );
  }

  function requestClose() {
    startClosing();
  }

  function finish(afterClose) {
    startClosing(afterClose, true);
  }

  function handleCancel(event) {
    event.preventDefault();
    requestClose();
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      requestClose();
    }
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className={[
        "vrgm-dialog",
        `vrgm-size-${size}`,
        isClosing ? "vrgm-closing" : "",
      ].join(" ")}
      aria-label={title}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      <div className="vrgm-shell">

        {/* Modal header */}

        <header className="vrgm-header">
          <div className="vrgm-heading">
            <span className="vrgm-eyebrow">
              VoltRoute Workspace
            </span>

            <h2>{title}</h2>

            {subtitle && <p>{subtitle}</p>}
          </div>

          <button
            type="button"
            className="vrgm-close"
            aria-label="Close dialog"
            onClick={requestClose}
            disabled={!dismissible || isClosing}
            autoFocus
          >
            <X size={22} />
          </button>
        </header>

        {/* Independently scrollable content */}

        <ModalFooterContext.Provider
          value={footerTarget}
        >
          <div
            className="vrgm-content"
            inert={isClosing}
          >
            {typeof children === "function"
              ? children({ requestClose, finish })
              : children}
          </div>
        </ModalFooterContext.Provider>

        {/* Shared footer */}

        <footer
          className="vrgm-footer"
          inert={isClosing}
        >
          <span className="vrgm-footer-label">
            VoltRoute Fleet Intelligence
          </span>

          {showFooter ? (
            <button
              type="button"
              className="vrgm-done"
              onClick={requestClose}
              disabled={!dismissible || isClosing}
            >
              Done
            </button>
          ) : (
            <div
              className="vrgm-custom-footer"
              ref={setFooterTarget}
            />
          )}
        </footer>

      </div>
    </dialog>,

    document.querySelector(".vrt-layout") ||
      document.body
  );
}