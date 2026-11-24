import { useEffect, useRef, useState } from "react";
import { IconX } from "@tabler/icons-react";
export interface EntryValues {
  code: string;
  memo: string;
  folder: string;
}
interface Props {
  folders: string[];
  initial: EntryValues;
  editing: boolean;
  onClose: () => void;
  onSave: (values: EntryValues) => Promise<void>;
}
export function EntryDialog({
  folders,
  initial,
  editing,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const el = ref.current;
    el?.querySelector<HTMLInputElement>("input")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (!ref.current?.hasAttribute("data-busy")) closeRef.current();
      }
      if (e.key === "Tab") {
        const nodes = el?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input,select,textarea",
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (!el?.contains(document.activeElement)) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
          return;
        }
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="ws-dialog-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={ref}
        className="ws-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-heading"
        data-busy={busy ? "true" : undefined}
      >
        <div className="ws-dialog-heading">
          <h2 id="entry-heading">
            {editing ? "바코드 수정" : "바코드 직접 입력"}
          </h2>
          <button
            className="ws-icon-button"
            aria-label="입력 창 닫기"
            disabled={busy}
            onClick={onClose}
          >
            <IconX size={21} />
          </button>
        </div>
        <p>바코드와 메모를 입력하고 저장할 폴더를 선택하세요.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!values.code.trim() || busy) return;
            setBusy(true);
            setError("");
            try {
              await onSave({
                ...values,
                code: values.code.trim(),
                memo: values.memo.trim(),
              });
              onClose();
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : "저장하지 못했습니다. 다시 시도하세요.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label htmlFor="entry-code">
            바코드 <span className="required">*</span>
          </label>
          <input
            id="entry-code"
            required
            maxLength={2048}
            value={values.code}
            onChange={(e) => setValues({ ...values, code: e.target.value })}
            placeholder="바코드 번호 또는 QR 코드 내용"
            autoComplete="off"
          />

          <label htmlFor="entry-memo">
            메모 <span className="optional">선택</span>
          </label>
          <input
            id="entry-memo"
            value={values.memo}
            onChange={(e) => setValues({ ...values, memo: e.target.value })}
            placeholder="예: 무선 키보드"
            maxLength={500}
          />

          <label htmlFor="entry-folder">저장 폴더</label>
          <select
            id="entry-folder"
            value={values.folder}
            onChange={(e) => setValues({ ...values, folder: e.target.value })}
          >
            {folders.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
          {error && (
            <p role="alert" className="ws-form-error">
              {error}
            </p>
          )}
          <div className="ws-dialog-footer">
            <button
              className="ws-button"
              type="button"
              disabled={busy}
              onClick={onClose}
            >
              취소
            </button>
            <button
              className="ws-button ws-primary"
              disabled={busy || !values.code.trim()}
            >
              {busy ? "저장 중…" : "저장하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
