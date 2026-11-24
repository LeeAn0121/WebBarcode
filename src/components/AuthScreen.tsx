import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  IconBarcode,
  IconScan,
  IconFolder,
  IconFileExport,
  IconArrowRight,
} from "@tabler/icons-react";
import { toast } from "sonner";
import "./auth-screen.css";

type AuthScreenProps = {
  supabase: { auth: Pick<SupabaseClient["auth"], "signInWithOAuth"> };
};

const previewItems = [
  { name: "무선 키보드", code: "8806094784231", folder: "업무 장비" },
  { name: "USB-C 허브", code: "8809753472219", folder: "업무 장비" },
  { name: "입고 상품", code: "8801112345678", folder: "입고 상품" },
];

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function AuthScreen({ supabase }: AuthScreenProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + window.location.pathname,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Google 로그인에 실패했습니다. 다시 시도해 주세요.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <header className="auth-header">
        <span className="auth-brand">
          <IconBarcode size={32} stroke={2.3} aria-hidden="true" />
          WebBarcode
        </span>
        <span className="auth-header-note">나만의 바코드 작업 공간</span>
      </header>

      <main className="auth-main">
        <section className="auth-story" aria-labelledby="auth-title">
          <h1 id="auth-title">
            바코드를 담고,
            <br />
            작업을 가볍게.
          </h1>
          <p className="auth-description">
            스캔한 바코드와 메모를 모아두고,
            <br className="auth-desktop-break" /> 필요할 때 찾고 내보내세요.
          </p>

          <figure className="auth-preview" aria-label="바코드 보관함 예시">
            <figcaption className="auth-preview-top">
              <span>
                <IconBarcode size={20} aria-hidden="true" />
                바코드 보관함
              </span>
              <span className="auth-preview-label">미리보기</span>
            </figcaption>
            <div className="auth-preview-table">
              <div className="auth-preview-columns" aria-hidden="true">
                <span>바코드 · 메모</span>
                <span>폴더</span>
              </div>
              {previewItems.map((item) => (
                <div className="auth-preview-row" key={item.code}>
                  <span className="auth-preview-barcode" aria-hidden="true" />
                  <div className="auth-preview-item">
                    <strong>{item.name}</strong>
                    <code>{item.code}</code>
                  </div>
                  <span className="auth-preview-folder">{item.folder}</span>
                </div>
              ))}
            </div>
            <p className="auth-preview-caption">
              예시 데이터로 살펴보는 내 작업 공간
            </p>
          </figure>

          <ul className="auth-features" aria-label="주요 기능">
            <li>
              <IconScan size={20} aria-hidden="true" />
              바코드 스캔
            </li>
            <li>
              <IconFolder size={20} aria-hidden="true" />
              폴더로 정리
            </li>
            <li>
              <IconFileExport size={20} aria-hidden="true" />
              Excel 내보내기
            </li>
          </ul>
        </section>

        <section className="auth-signin" aria-labelledby="auth-signin-title">
          <div className="auth-signin-icon">
            <IconBarcode size={32} stroke={1.8} aria-hidden="true" />
          </div>
          <h2 id="auth-signin-title">
            반가워요.
            <br /> 바코드 정리를 시작해 볼까요?
          </h2>
          <p className="auth-signin-description">
            Google 계정으로 로그인하고
            <br />내 바코드 보관함을 이어서 사용하세요.
          </p>
          <button
            className="auth-google-button"
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <span className="auth-spinner" aria-hidden="true" />
            ) : (
              <GoogleIcon />
            )}
            <span>
              {loading ? "Google에 연결하는 중…" : "Google 계정으로 계속하기"}
            </span>
            {!loading && (
              <IconArrowRight
                className="auth-google-arrow"
                size={18}
                aria-hidden="true"
              />
            )}
          </button>
          <p className="auth-storage-note">
            바코드와 폴더는 로그인한 계정의
            <br />
            클라우드 보관함에 저장됩니다.
          </p>
        </section>
      </main>

      <footer className="auth-footer">스캔부터 정리까지, WebBarcode</footer>
    </div>
  );
}
