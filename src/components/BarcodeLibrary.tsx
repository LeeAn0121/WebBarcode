import { useEffect, useRef } from "react";
import type { QuickFilter } from "../barcodeFilters";
import {
  IconBarcode,
  IconCalendar,
  IconFolder,
  IconSearch,
  IconFileExport,
  IconCopy,
  IconEdit,
  IconDots,
  IconCamera,
  IconPlus,
  IconInfoCircle,
} from "@tabler/icons-react";
export interface BarcodeRecord {
  id: string;
  code: string;
  memo?: string;
  folder?: string;
  created_at: string;
  user_id?: string;
}
export type SortOrder = "newest" | "oldest" | "name";
interface Props {
  all: BarcodeRecord[];
  rows: BarcodeRecord[];
  folders: string[];
  folder: string;
  query: string;
  sort: SortOrder;
  quickFilter: QuickFilter;
  filterCounts: Record<QuickFilter, number>;
  onQuickFilter: (filter: QuickFilter) => void;
  onResetFilters: () => void;
  selected: string[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  onFolder: (s: string) => void;
  onQuery: (s: string) => void;
  onSort: (s: SortOrder) => void;
  onSelect: (ids: string[]) => void;
  onScan: () => void;
  onManual: () => void;
  onExport: (selected?: boolean) => void;
  onMove: () => void;
  onDelete: () => void;
  onCopy: (code: string) => void;
  onEdit: (row: BarcodeRecord) => void;
  onMore: (id: string) => void;
}
function BarcodeRow({ row, p }: { row: BarcodeRecord; p: Props }) {
  return (
    <tr className={p.selected.includes(row.id) ? "row-selected" : ""}>
      <td className="row-checkbox">
        <input
          type="checkbox"
          aria-label={row.code + " 선택"}
          checked={p.selected.includes(row.id)}
          onChange={() =>
            p.onSelect(
              p.selected.includes(row.id)
                ? p.selected.filter((id) => id !== row.id)
                : [...p.selected, row.id],
            )
          }
        />
      </td>
      <td className="row-identity">
        {row.memo && <strong>{row.memo}</strong>}
        <span className="row-code">{row.code}</span>
      </td>
      <td className="row-folder">
        <span className="folder-tag">{row.folder || "기본폴더"}</span>
        <span className="row-mobile-date">
          {new Date(row.created_at).toLocaleDateString("ko-KR", {
            month: "2-digit",
            day: "2-digit",
          })}{" "}
          {new Date(row.created_at).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </span>
      </td>
      <td className="row-date">
        {new Date(row.created_at).toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })}{" "}
        <span>
          {new Date(row.created_at).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </span>
      </td>
      <td className="row-actions">
        <button
          onClick={() => p.onCopy(row.code)}
          aria-label={row.code + " 바코드 복사"}
        >
          <IconCopy size={18} />

          <span>복사</span>
        </button>
        <button onClick={() => p.onEdit(row)} aria-label={row.code + " 수정"}>
          <IconEdit size={18} />

          <span>수정</span>
        </button>
        <button
          onClick={() => p.onMore(row.id)}
          aria-label={row.code + " 더보기"}
        >
          <IconDots size={21} />
        </button>
      </td>
    </tr>
  );
}
export function BarcodeLibrary(p: Props) {
  const selectAllRef = useRef<HTMLInputElement>(null);
  const today = new Date().toDateString();
  const allSelected =
    p.rows.length > 0 && p.rows.every((r) => p.selected.includes(r.id));
  useEffect(() => {
    if (selectAllRef.current)
      selectAllRef.current.indeterminate =
        !allSelected && p.rows.some((row) => p.selected.includes(row.id));
  }, [allSelected, p.rows, p.selected]);
  return (
    <section className="barcode-library">
      <div className="ws-page-heading">
        <div>
          <h1>바코드 보관함</h1>
          <p>스캔한 바코드를 한곳에서 찾고 정리하세요.</p>
        </div>
        <div className="ws-heading-actions">
          <button className="ws-button" onClick={p.onManual}>
            <IconEdit size={19} />
            직접 입력
          </button>
          <button
            className="ws-button ws-primary"
            onClick={p.onScan}
            aria-label="바코드 스캐너 열기"
          >
            <IconCamera size={20} />
            바코드 스캔
          </button>
        </div>
      </div>
      <div className="ws-summary">
        <div>
          <IconBarcode />

          <span className="ws-summary-full">전체 바코드</span>
          <span className="ws-summary-short">전체</span>
          <strong>{p.all.length}</strong>
        </div>
        <div>
          <IconCalendar />

          <span className="ws-summary-full">오늘 등록</span>
          <span className="ws-summary-short">오늘</span>
          <strong>
            {
              p.all.filter(
                (r) => new Date(r.created_at).toDateString() === today,
              ).length
            }
          </strong>
        </div>
        <div>
          <IconFolder />

          <span className="ws-summary-full">폴더 수</span>
          <span className="ws-summary-short">폴더</span>
          <strong>{p.folders.length}</strong>
        </div>
      </div>
      <div className="library-panel">
        <div
          className="library-quick-filters"
          role="group"
          aria-label="빠른 필터"
        >
          {(
            [
              ["all", "전체"],
              ["today", "오늘 등록"],
              ["hasMemo", "메모 있음"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={p.quickFilter === value}
              onClick={() => p.onQuickFilter(value)}
            >
              {label}
              <span>{p.filterCounts[value]}</span>
            </button>
          ))}
        </div>
        <div className="library-toolbar">
          <label className="library-search">
            <IconSearch size={20} />

            <input
              id="barcode-search"
              aria-label="바코드 또는 메모 검색"
              placeholder="바코드 또는 메모 검색"
              value={p.query}
              onChange={(e) => p.onQuery(e.target.value)}
            />
          </label>
          <select
            aria-label="폴더 필터"
            value={p.folder}
            onChange={(e) => p.onFolder(e.target.value)}
          >
            <option value="전체">전체 폴더</option>
            {p.folders.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
          <select
            aria-label="정렬 순서"
            value={p.sort}
            onChange={(e) => p.onSort(e.target.value as SortOrder)}
          >
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="name">바코드순</option>
          </select>
          <button
            className="ws-button"
            aria-label="Excel 내보내기"
            onClick={() => p.onExport()}
            disabled={!p.rows.length}
          >
            <IconFileExport size={19} />
            <span>Excel 내보내기</span>
          </button>
        </div>
        {(p.query.trim() || p.folder !== "전체" || p.quickFilter !== "all") &&
          p.rows.length > 0 && (
            <div className="library-active-filters">
              <span>필터가 적용된 {p.rows.length}개 항목</span>
              <button onClick={p.onResetFilters}>필터 초기화</button>
            </div>
          )}
        {p.selected.length > 0 && (
          <div
            className="library-selection"
            role="toolbar"
            aria-label="선택한 바코드 작업"
          >
            <strong>{p.selected.length}개 선택됨</strong>
            <div>
              <button onClick={p.onMove}>폴더 이동</button>
              <button onClick={() => p.onExport(true)}>선택 내보내기</button>
              <button className="ws-danger" onClick={p.onDelete}>
                삭제
              </button>
              <button onClick={() => p.onSelect([])}>선택 해제</button>
            </div>
          </div>
        )}
        {p.loading ? (
          <div className="ws-empty" role="status">
            <IconBarcode size={36} />

            <h2>바코드를 불러오는 중…</h2>
          </div>
        ) : p.error ? (
          <div className="ws-empty" role="alert">
            <h2>보관함을 불러오지 못했습니다</h2>
            <p>{p.error}</p>
            <button className="ws-button" onClick={p.onRetry}>
              다시 시도
            </button>
          </div>
        ) : p.rows.length ? (
          <div className="library-table-wrap">
            <table className="library-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      ref={selectAllRef}
                      aria-label="표시된 바코드 모두 선택"
                      checked={allSelected}
                      onChange={() =>
                        p.onSelect(
                          allSelected
                            ? p.selected.filter(
                                (id) => !p.rows.some((r) => r.id === id),
                              )
                            : [
                                ...new Set([
                                  ...p.selected,
                                  ...p.rows.map((r) => r.id),
                                ]),
                              ],
                        )
                      }
                    />
                  </th>
                  <th>바코드 · 메모</th>
                  <th>폴더</th>
                  <th>등록일</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {p.rows.map((row) => (
                  <BarcodeRow key={row.id} row={row} p={p} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ws-empty">
            <div className="empty-icon">
              <IconBarcode size={36} />
            </div>
            <h2>
              {p.query || p.folder !== "전체" || p.quickFilter !== "all"
                ? "검색 결과가 없습니다"
                : "첫 바코드를 등록해 보세요"}
            </h2>
            <p>
              {p.query || p.folder !== "전체" || p.quickFilter !== "all"
                ? "다른 검색어나 폴더로 다시 찾아보세요."
                : "카메라로 스캔하거나 번호를 직접 입력해 시작하세요."}
            </p>
            {p.query || p.folder !== "전체" || p.quickFilter !== "all" ? (
              <button className="ws-button" onClick={p.onResetFilters}>
                필터 초기화
              </button>
            ) : (
              <button className="ws-button ws-primary" onClick={p.onManual}>
                <IconPlus size={18} />
                직접 입력
              </button>
            )}
          </div>
        )}
        <footer className="library-footer">
          <span>
            총 {p.all.length}개 중 {p.rows.length}개
          </span>
          <span>
            <IconInfoCircle size={17} />
            바코드를 선택하면 한 번에 이동하거나 내보낼 수 있어요.
          </span>
        </footer>
      </div>
    </section>
  );
}
