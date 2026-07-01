# Кустик как Telegram Mini App

Telegram Mini App — это веб-сайт (HTTPS), который открывается внутри Telegram по кнопке бота.
Наш Expo-web билд для этого подходит: интеграция с Telegram уже встроена.

## Что уже сделано в коде
- [src/telegram/telegram.ts](src/telegram/telegram.ts) — подключение Telegram Web App SDK, `ready()` + `expand()` (разворот на весь экран), цвета шапки/фона, системная кнопка «Назад», haptic-отклик. Вне Telegram — безопасный no-op.
- [App.tsx](App.tsx) — вызывает `initTelegram()` при старте; системная кнопка «Назад» Telegram закрывает верхний открытый лист/оверлей.
- Тактильный отклик при завершении дела ([store.tsx](src/state/store.tsx)).
- [app.json](app.json) — web `output: single` (одностраничный статический сайт).

## Шаг 1. Собрать статику
```bash
cd app
npx expo export --platform web --output-dir dist
```
Готовый сайт — в папке `dist/` (это `index.html` + `_expo/` + шрифты). Именно её нужно захостить.

## Шаг 2. Захостить по HTTPS
Telegram требует **HTTPS**. Любой из вариантов:

**A. Быстро протестировать сегодня (без аккаунтов, временный URL):**
```bash
# терминал 1 — отдать папку dist
npx serve dist -l 5000
# терминал 2 — временный HTTPS-туннель (анонимный, бесплатный)
npx cloudflared tunnel --url http://localhost:5000
```
Cloudflared выдаст ссылку вида `https://xxxx.trycloudflare.com` — она живёт, пока запущен туннель. Годится для проверки в Telegram.

**B. Постоянный хостинг (бесплатно):**
- **Cloudflare Pages / Netlify / Vercel** — залить папку `dist` (drag-and-drop в веб-интерфейсе или CLI). Получишь постоянный `https://…`.
- **GitHub Pages** — запушить `dist` в репозиторий и включить Pages.

## Шаг 3. Создать бота и привязать мини-апп
1. В Telegram открой **@BotFather** → `/newbot` → задай имя и username → получишь **токен** (сохрани).
2. `/newapp` → выбери своего бота → заполни название, описание, картинку (512×512), короткое имя (short name) → **укажи URL** из шага 2.
3. Готово. Мини-апп открывается по ссылке `https://t.me/ТВОЙ_БОТ/КОРОТКОЕ_ИМЯ` или кнопкой в боте.

### (необязательно) Кнопка «Открыть Кустик» в меню бота
BotFather → `/mybots` → выбрать бота → **Bot Settings → Menu Button → Configure menu button** → указать тот же URL и текст кнопки. Тогда в чате с ботом появится постоянная кнопка запуска.

## Бэкенд (Pages Functions, папка `functions/`)

Деплоится автоматически вместе с сайтом при `git push`. Эндпоинты (same-origin `kustik.pages.dev/api/*`):
- `POST /api/webhook` — вебхук бота (/start, /help), защищён secret_token.
- `POST /api/reminder` — регистрация ежедневного напоминания (подпись initData).
- `GET /api/cron?key=<CRON_SECRET>` — ежечасная рассылка напоминаний (дёргается внешним планировщиком, напр. cron-job.org).
- `POST /api/home/create|join|sync` — совместный дом: создание, вступление по `startapp=h_<id>`, синхронизация (LWW по ревизиям).

Все запросы от клиента подписаны Telegram `initData` и валидируются HMAC-ом на сервере.

### Что нужно настроить в Cloudflare Pages (dashboard, один раз)
1. **KV**: Storage & Databases → KV → Create namespace (`kustik`). Затем в проекте Pages:
   Settings → Bindings → Add → KV namespace, имя переменной **`KV`**, выбрать созданный namespace.
2. **Переменные**: Settings → Environment variables (Production):
   - `BOT_TOKEN` = токен бота (Secret)
   - `CRON_SECRET` = секрет из настройки вебхука (Secret)
3. Redeploy (Deployments → Retry deployment), чтобы биндинги подхватились.

### Планировщик напоминаний
На [cron-job.org](https://cron-job.org) (бесплатно) создать задание: URL
`https://kustik.pages.dev/api/cron?key=<CRON_SECRET>`, расписание — каждый час в :01.

## Заметки
- Данные сохраняются в `localStorage` браузера Telegram (для MVP этого хватает). Если нужен общий прогресс между устройствами/участниками — понадобится бэкенд (можно через `initData` бота для авторизации пользователя).
- Демо-кнопка «↻ промотать день вперёд» — инструмент показа движка; перед реальным релизом заменить на настоящие даты.
- SDK грузится с `https://telegram.org/js/telegram-web-app.js` в рантайме — интернет в момент запуска нужен (внутри Telegram он всегда есть).
