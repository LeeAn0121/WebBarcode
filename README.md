# WebBarcode 📦

WebBarcode는 스마트폰 카메라를 이용해 언제 어디서나 바코드를 스캔하고, 개인 클라우드 저장소(Supabase)에 영구적으로 보관할 수 있는 **강력하고 현대적인 PWA 바코드 관리 애플리케이션**입니다.

## 🚀 주요 기능 (Features)

*   📸 **강력한 바코드 스캔:** QR 코드, EAN-13, CODE-128 등 현존하는 대부분의 1D/2D 바코드를 초고속으로 스캔합니다.
*   🚀 **초고속 연속 스캔 모드 (Batch Mode):** 화면을 멈추지 않고 1초에 여러 개의 바코드를 쉼 없이 연속으로 저장하여 재고 조사 등의 작업 효율을 극대화합니다.
*   🤖 **상품 정보 자동 검색 (Auto-Lookup):** 바코드를 스캔하면 Open API를 통해 전 세계 데이터베이스에서 상품명을 자동으로 찾아 메모에 등록합니다.
*   📳 **진동 햅틱 피드백:** 실제 하드웨어 스캐너처럼 스캔 성공 시 스마트폰에 짜릿한 진동 피드백을 제공합니다.
*   🔐 **안전한 개인 클라우드 동기화:** Google 계정으로 1초 만에 로그인하고, 나만의 고립된 개인 저장 공간(Supabase Auth & RLS)에 데이터를 안전하게 저장합니다.
*   📁 **스마트 폴더 관리:** 여러 개의 바코드를 폴더 단위로 묶어서 깔끔하게 관리할 수 있습니다.
*   📱 **PWA 및 오프라인 모드 지원:** 앱스토어를 거칠 필요 없이 홈 화면에 바로 설치(Add to Home Screen)할 수 있으며, 오프라인 환경에서도 작동합니다.
*   📤 **데이터 백업 및 엑셀 추출:** 언제든 모든 데이터를 JSON으로 백업하거나 엑셀(Excel) 파일로 다운로드할 수 있습니다.
*   🎨 **아름다운 모던 UI:** Tailwind CSS와 다크 모드를 완벽하게 지원하는 데스크탑/모바일 반응형 디자인을 제공합니다.

## 🛠️ 기술 스택 (Tech Stack)

*   **Frontend:** React (Vite), TypeScript, Tailwind CSS, Tabler Icons
*   **Backend / DB:** Supabase (PostgreSQL, Auth, Realtime)
*   **Scanner Engine:** Html5Qrcode
*   **PWA:** Service Worker, Manifest

## 💻 설치 및 실행 (Installation)

\`\`\`bash
npm install
npm run dev
\`\`\`
