import {
  useEffect,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "voltroute.sidebar.width";

const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 220;
const MAX_WIDTH = 380;

function clampWidth(width) {
  return Math.min(
    MAX_WIDTH,
    Math.max(MIN_WIDTH, width)
  );
}

function getInitialWidth() {
  try {
    const savedWidth = localStorage.getItem(STORAGE_KEY);

    if (savedWidth !== null) {
      const parsedWidth = Number(savedWidth);

      if (Number.isFinite(parsedWidth) && parsedWidth > 0) {
        return clampWidth(parsedWidth);
      }
    }
  } catch {
    // Use the default width if storage is unavailable.
  }

  return DEFAULT_WIDTH;
}

export default function useSidebarResize() {
  const [sidebarWidth, setSidebarWidth] =
    useState(getInitialWidth);

  const [isResizing, setIsResizing] = useState(false);

  const dragRef = useRef(null);

  /* Save the selected width */

  useEffect(() => {
    if (isResizing) {
      return;
    }

    try {
      localStorage.setItem(
        STORAGE_KEY,
        String(sidebarWidth)
      );
    } catch {
      // Resizing remains available without storage.
    }
  }, [sidebarWidth, isResizing]);


  /* Prevent text selection while dragging */

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const previousCursor = document.body.style.cursor;
    const previousUserSelect =
      document.body.style.userSelect;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect =
        previousUserSelect;
    };
  }, [isResizing]);


  /* Start resizing */

  function startResize(event) {
    if (event.button !== 0 || !event.isPrimary) {
      return;
    }

    event.preventDefault();

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: sidebarWidth,
    };

    event.currentTarget.setPointerCapture(
      event.pointerId
    );

    setIsResizing(true);
  }


  /* Resize the sidebar */

  function moveResize(event) {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const difference = event.clientX - drag.startX;

    const newWidth = clampWidth(
      drag.startWidth + difference
    );

    setSidebarWidth(Math.round(newWidth));
  }


  /* Finish resizing */

  function stopResize(event) {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    dragRef.current = null;

    setIsResizing(false);

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      );
    }
  }


  /* Restore default width */

  function resetWidth() {
    setSidebarWidth(DEFAULT_WIDTH);
  }


  /* Keyboard accessibility */

  function handleResizeKeyDown(event) {
    const step = event.shiftKey ? 25 : 10;

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();

        setSidebarWidth((previous) =>
          clampWidth(previous - step)
        );

        break;

      case "ArrowRight":
        event.preventDefault();

        setSidebarWidth((previous) =>
          clampWidth(previous + step)
        );

        break;

      case "Home":
        event.preventDefault();
        setSidebarWidth(MIN_WIDTH);
        break;

      case "End":
        event.preventDefault();
        setSidebarWidth(MAX_WIDTH);
        break;

      case "Enter":
        event.preventDefault();
        resetWidth();
        break;

      default:
        break;
    }
  }

  return {
    sidebarWidth,
    isResizing,

    minWidth: MIN_WIDTH,
    maxWidth: MAX_WIDTH,

    startResize,
    moveResize,
    stopResize,
    resetWidth,
    handleResizeKeyDown,
  };
}
