import { useEffect, useRef } from "react";

interface ManagedDialog {
  id: string;
  open: boolean;
  onClose: () => void;
}
interface DialogEntry {
  element: HTMLElement;
  returnFocus: HTMLElement | null;
}
const FOCUSABLE =
  'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';
function focusable(element: HTMLElement) {
  return Array.from(element.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (node) => node.getClientRects().length > 0 && !node.closest("[inert]"),
  );
}
function initialFocus(element: HTMLElement) {
  const preferred = element.querySelector<HTMLElement>(
    "[data-dialog-initial-focus], input:not([readonly]):not(:disabled), select:not(:disabled), textarea:not(:disabled)",
  );
  (preferred || focusable(element)[0] || element).focus();
}

/** One manager for legacy overlays, ordered by their actual stacking level. */
export function useDialogFocusManager(
  dialogs: ManagedDialog[],
  paused: boolean,
) {
  const callbacks = useRef(dialogs);
  const entries = useRef(new Map<string, DialogEntry>());
  const current = useRef<string | null>(null);
  const pauseRef = useRef(paused);
  const signature = dialogs
    .filter((dialog) => dialog.open)
    .map((dialog) => dialog.id)
    .join("|");

  useEffect(() => {
    callbacks.current = dialogs;
    pauseRef.current = paused;
  });

  useEffect(() => {
    const previousId = current.current;
    const previousEntries = entries.current;
    const open = new Set(
      callbacks.current
        .filter((dialog) => dialog.open)
        .map((dialog) => dialog.id),
    );
    const removed = Array.from(previousEntries.entries()).filter(
      ([id]) => !open.has(id),
    );
    let returnTarget =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const removedTop = removed.find(([id]) => id === previousId)?.[1];
    if (
      removedTop &&
      (returnTarget === document.body ||
        !returnTarget?.isConnected ||
        removedTop.element.contains(returnTarget))
    ) {
      returnTarget = removedTop.returnFocus;
    }
    // A dialog can replace another in one render. Follow its original opener.
    for (const [, entry] of removed) {
      if (!returnTarget?.isConnected || entry.element.contains(returnTarget))
        returnTarget = entry.returnFocus;
    }
    for (const [id] of removed) previousEntries.delete(id);
    for (const id of open) {
      const element = document.getElementById(id);
      if (element && !previousEntries.has(id)) {
        previousEntries.set(id, { element, returnFocus: returnTarget });
      }
    }
    const ordered = Array.from(previousEntries.entries()).sort((a, b) => {
      const zDifference =
        (Number.parseInt(getComputedStyle(a[1].element).zIndex) || 0) -
        (Number.parseInt(getComputedStyle(b[1].element).zIndex) || 0);
      return (
        zDifference ||
        (a[1].element.compareDocumentPosition(b[1].element) &
        Node.DOCUMENT_POSITION_FOLLOWING
          ? -1
          : 1)
      );
    });
    const next = ordered[ordered.length - 1];
    const changed = current.current !== (next?.[0] || null);
    current.current = next?.[0] || null;
    if (!paused && changed) {
      if (next) {
        if (returnTarget?.isConnected && next[1].element.contains(returnTarget))
          returnTarget.focus();
        else if (!next[1].element.contains(document.activeElement))
          initialFocus(next[1].element);
      } else if (removed.length) {
        const opener = removedTop?.returnFocus || returnTarget;
        if (opener?.isConnected) opener.focus();
        else
          document
            .querySelector<HTMLElement>(
              ".workspace-main button, .workspace-topbar button",
            )
            ?.focus();
      }
    }
  }, [signature, paused]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (pauseRef.current || !current.current) return;
      const entry = entries.current.get(current.current);
      if (!entry) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        callbacks.current
          .find((dialog) => dialog.id === current.current)
          ?.onClose();
      } else if (event.key === "Tab") {
        const nodes = focusable(entry.element);
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (!first || !last) {
          event.preventDefault();
          entry.element.focus();
        } else if (
          event.shiftKey &&
          (document.activeElement === first ||
            !entry.element.contains(document.activeElement))
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            !entry.element.contains(document.activeElement))
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const onFocus = (event: FocusEvent) => {
      if (pauseRef.current || !current.current) return;
      const entry = entries.current.get(current.current);
      if (entry && !entry.element.contains(event.target as Node))
        initialFocus(entry.element);
    };
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusin", onFocus);
    };
  }, []);
}
