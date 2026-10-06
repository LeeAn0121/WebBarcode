const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

if (!app.includes("import JsBarcode from 'jsbarcode'")) {
    app = app.replace(/import \{ \w+ \} from 'react-sortablejs';/, `$&
import JsBarcode from 'jsbarcode';`);
}

const miniBarcodeComponent = `

const MiniBarcode = ({ code }: { code: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (canvasRef.current && code) {
      try {
        JsBarcode(canvasRef.current, code, {
          format: "CODE128",
          displayValue: false,
          margin: 0,
          background: "transparent",
          lineColor: "currentColor",
          width: 1,
          height: 30
        });
      } catch(e) {
        // Fallback for codes that CODE128 doesn't support easily (e.g. non-ascii)
      }
    }
  }, [code]);

  return <canvas ref={canvasRef} className="w-16 h-8 opacity-40 dark:opacity-60 invert-0 dark:invert" />;
};

`;

if (!app.includes('const MiniBarcode')) {
    app = app.replace(/export default function App\(\) \{/, miniBarcodeComponent + '\nexport default function App() {');
}

// Add the MiniBarcode to the list item rendering!
// Find the <div className="flex items-center gap-4 py-2"> (inside the list item render)
// We have two lists: home tab and folders tab.
// In home tab: <div className="flex items-center gap-4 py-2">
const listItemRegex = /<div className="flex items-center gap-4 py-2">/g;
app = app.replace(listItemRegex, `<div className="flex items-center gap-4 py-2 w-full max-w-full">
                            <div className="hidden sm:flex shrink-0">
                               <MiniBarcode code={item.code} />
                            </div>`);

fs.writeFileSync('src/App.tsx', app);
console.log("MiniBarcode component added");
