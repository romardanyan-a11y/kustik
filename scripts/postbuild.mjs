// Пост-обработка dist/index.html после `expo export` для Telegram Mini App:
//  1) подключаем Telegram Web App SDK в <head> (до бандла приложения);
//  2) корректный мобильный viewport (viewport-fit=cover, без зума);
//  3) глобальный перехватчик ошибок — если что-то падает до React,
//     на экране появляется текст ошибки вместо пустого экрана.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const file = resolve('dist', 'index.html');
if (!existsSync(file)) {
  console.error('[postbuild] dist/index.html не найден — сначала запусти expo export');
  process.exit(1);
}

let html = readFileSync(file, 'utf8');

// 1) Telegram SDK в head (обычный script, грузится до defer-бандла приложения).
const tgTag = '<script src="https://telegram.org/js/telegram-web-app.js"></script>';
if (!html.includes('telegram-web-app.js')) {
  html = html.replace('</head>', `  ${tgTag}\n  </head>`);
}

// 2) Мобильный viewport под Telegram.
html = html.replace(
  /<meta name="viewport"[^>]*>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, shrink-to-fit=no" />'
);

// 3) Глобальный перехватчик ошибок (виден на экране в Telegram).
const errScript = `<script>
(function(){
  function show(msg){
    try{
      var r=document.getElementById('root');
      var d=document.createElement('div');
      d.style.cssText='position:fixed;left:0;right:0;top:0;z-index:99999;background:#F6DCD2;color:#7a2a16;font:13px -apple-system,system-ui,sans-serif;padding:16px 18px;white-space:pre-wrap;';
      d.textContent='Кустик: '+msg;
      document.body.appendChild(d);
    }catch(e){}
  }
  window.addEventListener('error',function(e){ show((e && e.message)||'script error'); });
  window.addEventListener('unhandledrejection',function(e){ show('promise: '+((e && e.reason && (e.reason.message||e.reason))||'')); });
})();
</script>`;
if (!html.includes('Кустик: ')) {
  html = html.replace('</head>', `  ${errScript}\n  </head>`);
}

writeFileSync(file, html);
console.log('[postbuild] dist/index.html обновлён: Telegram SDK + viewport + перехватчик ошибок');
