// Ежечасная рассылка напоминаний. Дёргается внешним планировщиком:
//   GET /api/cron?key=<CRON_SECRET>
// Для каждого подписчика: если его локальный час == выбранному часу — шлём сообщение.
import { Env, PagesContext, err, json, tg } from './_utils';

const APP_URL = 'https://kustik.pages.dev';

const TEXTS = [
  'Кустик проснулся и ждёт 🌱 Загляни — там всего пара дел.',
  'Пора полить чистотой! Кустик соскучился 🪴',
  'Маленькое дело сегодня — цветущий кустик завтра ✨',
  'Кустик шепчет: «5 минут — и дом станет чуточку лучше» 🌿',
];

interface RemDoc {
  chatId: number;
  hour: number;
  tzMin: number;
  name?: string;
}

export const onRequestGet = async (ctx: PagesContext): Promise<Response> => {
  const { request, env } = ctx;
  const url = new URL(request.url);
  if (!env.CRON_SECRET || url.searchParams.get('key') !== env.CRON_SECRET) return err('forbidden', 403);

  const nowUtcMin = Math.floor(Date.now() / 60000) % 1440;
  const dayStamp = Math.floor(Date.now() / 86400000);
  let sent = 0;
  let cursor: string | undefined;

  do {
    const page = await env.KV.list({ prefix: 'rem:', cursor });
    for (const k of page.keys) {
      const raw = await env.KV.get(k.name);
      if (!raw) continue;
      let rem: RemDoc;
      try {
        rem = JSON.parse(raw) as RemDoc;
      } catch {
        continue;
      }
      const localMin = (((nowUtcMin + rem.tzMin) % 1440) + 1440) % 1440;
      const localHour = Math.floor(localMin / 60);
      if (localHour !== rem.hour) continue;

      // Не дублируем в течение суток (cron могут дёрнуть чаще раза в час).
      const sentKey = `remsent:${rem.chatId}:${dayStamp}`;
      if (await env.KV.get(sentKey)) continue;

      const text = TEXTS[(rem.chatId + dayStamp) % TEXTS.length];
      await tg(env.BOT_TOKEN, 'sendMessage', {
        chat_id: rem.chatId,
        text,
        reply_markup: { inline_keyboard: [[{ text: '🌱 Открыть Кустик', web_app: { url: APP_URL } }]] },
      });
      await env.KV.put(sentKey, '1', { expirationTtl: 90000 }); // ~сутки
      sent++;
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  return json({ ok: true, sent });
};
