import { useId, useRef, useState } from "react";
import { IconX } from "@tabler/icons-react";

export interface ActionDialogProps {
  title: string;
  description?: string;
  placeholder?: string;
  value?: string;
  type?: string;
  confirmText?: string;
  label?: string;
  required?: boolean;
  hideInput?: boolean;
  danger?: boolean;
  onConfirm: (value: string) => void | Promise<void>;
  onClose: () => void;
}

export function ActionDialog({
  title,
  description,
  placeholder,
  value = "",
  type = "text",
  confirmText = "확인",
  label = "입력값",
  required = false,
  hideInput = false,
  danger = false,
  onConfirm,
  onClose,
}: ActionDialogProps) {
  const id = useId();
  const [input, setInput] = useState(value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const close = () => {
    if (!pending.current) onClose();
  };

  return (
    <div
      id="prompt-dialog"
      className="ws-dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-heading`}
      aria-describedby={description ? `${id}-description` : undefined}
      aria-busy={busy}
      tabIndex={-1}
      data-dialog-pending={busy ? "true" : undefined}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="ws-dialog">
        <div className="ws-dialog-heading">
          <h2 id={`${id}-heading`}>{title}</h2>
          <button
            type="button"
            className="ws-icon-button"
            aria-label="작업 창 닫기"
            disabled={busy}
            onClick={close}
          >
            <IconX size={21} />
          </button>
        </div>
        {description && <p id={`${id}-description`}>{description}</p>}
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (pending.current) return;
            if (!hideInput && required && !input.trim()) {
              setError(`${label} 항목을 입력해주세요.`);
              return;
            }
            pending.current = true;
            setBusy(true);
            setError("");
            try {
              await onConfirm(required && !hideInput ? input.trim() : input);
              onClose();
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : "처리하지 못했습니다. 다시 시도하세요.",
              );
            } finally {
              pending.current = false;
              setBusy(false);
            }
          }}
        >
          {!hideInput && (
            <>
              <label htmlFor={`${id}-input`}>
                {label}
                {required && <span className="required"> *</span>}
              </label>
              <input
                id={`${id}-input`}
                type={type}
                value={input}
                placeholder={placeholder}
                required={required}
                disabled={busy}
                autoComplete="off"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
                onChange={(event) => {
                  setInput(event.target.value);
                  setError("");
                }}
              />
            </>
          )}
          {error && (
            <p id={`${id}-error`} className="ws-form-error" role="alert">
              {error}
            </p>
          )}
          <div className="ws-dialog-footer">
            <button
              className="ws-button"
              type="button"
              disabled={busy}
              onClick={close}
            >
              취소
            </button>
            <button
              className={`ws-button ${danger ? "ws-danger" : "ws-primary"}`}
              type="submit"
              disabled={busy}
            >
              {busy ? "처리 중…" : confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
