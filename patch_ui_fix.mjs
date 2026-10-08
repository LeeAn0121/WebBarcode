import fs from 'fs';
const appPath = 'E:/GITHUB/WebBarcode/src/App.tsx';
let code = fs.readFileSync(appPath, 'utf8');

// 1. Remove version tag from header
const versionTagRegex = /<a href=\{`https:\/\/github\.com\/LeeAn0121\/WebBarcode\/releases\/tag\/v\$\{latestVersion\}`\}[\s\S]*?<\/a>/g;
// ensure we only remove it from the header, not from settings!
// wait, the previous patch added it to settings, so there are two now?
// Let's check if the previous patch removed it. The previous patch had a regex that didn't match because of \s*<button onClick={.*?setIsNoticeHistoryOpen
// so it didn't remove the version tag or the dark mode button from the header!
// Let's remove them properly now.

const headerRegex = /<div className="flex items-center gap-2 shrink-0">([\s\S]*?)<\/header>/;

code = code.replace(headerRegex, (match) => {
    // Inside this match, we remove the <a> and the dark mode button
    let inner = match.replace(/<a href=\{`https:\/\/github\.com\/LeeAn0121\/WebBarcode\/releases\/tag\/v\$\{latestVersion\}`\}[\s\S]*?<\/a>/, '');
    inner = inner.replace(/<button onClick=\{\(\) => setDarkMode\(!darkMode\)\}[\s\S]*?<\/button>/, '');
    return inner;
});

// 2. Change menu names in sidebar
code = code.replace(/<span>전체 바코드<\/span>/, '<span>홈</span>');
code = code.replace(/<span>환경설정<\/span>/, '<span>설정</span>');

fs.writeFileSync(appPath, code, 'utf8');
console.log('Patch applied successfully!');
