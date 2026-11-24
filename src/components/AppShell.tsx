import type { ReactNode } from "react";
import {
  IconBarcode,
  IconCamera,
  IconFolder,
  IconHome,
  IconSettings,
  IconMoon,
  IconSun,
  IconBell,
  IconPlus,
  IconLogout,
} from "@tabler/icons-react";
export type WorkspaceTab = "home" | "folders" | "settings";
interface Props {
  children: ReactNode;
  tab: string;
  onNavigate: (tab: WorkspaceTab) => void;
  onScan: () => void;
  folders: string[];
  folder: string;
  counts: Record<string, number>;
  onFolder: (folder: string) => void;
  onAddFolder: () => void;
  email: string;
  dark: boolean;
  onTheme: () => void;
  onNotices: () => void;
  unread: number;
  onSignOut: () => void;
}
export function AppShell(p: Props) {
  const items = [
    { id: "home" as const, label: "바코드 보관함", icon: IconHome },
    { id: "folders" as const, label: "폴더 관리", icon: IconFolder },
    { id: "settings" as const, label: "설정", icon: IconSettings },
  ];
  return (
    <div className="workspace-shell">
      <aside className="workspace-rail">
        <a
          className="workspace-brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            p.onNavigate("home");
          }}
        >
          <IconBarcode size={32} />

          <span>WebBarcode</span>
        </a>
        <button
          className="ws-button ws-primary rail-scan"
          onClick={p.onScan}
          aria-label="바코드 스캐너 열기"
        >
          <IconCamera size={20} />
          바코드 스캔
        </button>
        <nav className="rail-nav" aria-label="주 메뉴">
          {items.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              aria-current={p.tab === id ? "page" : undefined}
              onClick={() => p.onNavigate(id)}
            >
              <Icon size={22} />
              {label}
            </button>
          ))}
        </nav>
        <div className="rail-folders">
          <div className="rail-section-label">
            <span>폴더</span>
            <button aria-label="새 폴더 만들기" onClick={p.onAddFolder}>
              <IconPlus size={18} />
            </button>
          </div>
          {p.folders.map((f) => (
            <button
              className={p.tab === "home" && p.folder === f ? "is-active" : ""}
              key={f}
              onClick={() => p.onFolder(f)}
            >
              <IconFolder size={19} />

              <span title={f}>{f}</span>
              <small>{p.counts[f] || 0}</small>
            </button>
          ))}
        </div>
        <div className="rail-account">
          <span className="account-avatar">
            {p.email.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <strong title={p.email}>{p.email}</strong>
            <span>내 작업 공간</span>
          </div>
          <button aria-label="로그아웃" onClick={p.onSignOut}>
            <IconLogout size={19} />
          </button>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="workspace-topbar">
          <span className="desktop-workspace-title">내 작업 공간</span>
          <span className="mobile-brand">
            <IconBarcode size={24} />
            WebBarcode
          </span>
          <div>
            <button
              onClick={p.onNotices}
              aria-label="공지사항"
              className="ws-icon-button"
            >
              <IconBell size={21} />
              {p.unread > 0 && <i />}
            </button>
            <button
              onClick={p.onTheme}
              aria-label={p.dark ? "라이트 모드로 전환" : "다크 모드로 전환"}
              className="ws-icon-button"
            >
              {p.dark ? <IconSun size={21} /> : <IconMoon size={21} />}
            </button>
          </div>
        </header>
        {p.children}
      </div>
      <nav className="mobile-nav" aria-label="모바일 주 메뉴">
        <button
          aria-current={p.tab === "home" ? "page" : undefined}
          onClick={() => p.onNavigate("home")}
        >
          <IconHome size={22} />
          보관함
        </button>
        <button onClick={p.onScan} aria-label="바코드 스캐너 열기">
          <IconCamera size={22} />
          스캔
        </button>
        <button
          aria-current={p.tab === "folders" ? "page" : undefined}
          onClick={() => p.onNavigate("folders")}
        >
          <IconFolder size={22} />
          폴더
        </button>
        <button
          aria-current={p.tab === "settings" ? "page" : undefined}
          onClick={() => p.onNavigate("settings")}
        >
          <IconSettings size={22} />
          설정
        </button>
      </nav>
    </div>
  );
}
