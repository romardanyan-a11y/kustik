// Ежечасная рассылка напоминаний. Дёргается внешним планировщиком:
//   GET /api/cron?key=<CRON_SECRET>
// Для каждого подписчика: если его локальный час == выбранному часу — шлём сообщение.
// По воскресеньям (~18:00 UTC) — дайджест недели для общих домов.
import { Env, HomeDoc, PagesContext, err, json, tg } from './_utils';

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

  // --- Дайджест недели по домам (вс, ~18:00 UTC) ---
  let digests = 0;
  const now = new Date();
  if (now.getUTCDay() === 0 && now.getUTCHours() === 18) {
    const weekStamp = Math.floor(Date.now() / (7 * 86400000));
    let hc: string | undefined;
    do {
      const page = await env.KV.list({ prefix: 'home:', cursor: hc });
      for (const k of page.keys) {
        const raw = await env.KV.get(k.name);
        if (!raw) continue;
        let doc: HomeDoc;
        try {
          doc = JSON.parse(raw) as HomeDoc;
        } catch {
          continue;
        }
        if (doc.members.length < 2 || !doc.state) continue;
        const homeId = k.name.slice('home:'.length);
        const sentKey = `digestsent:${homeId}:${weekStamp}`;
        if (await env.KV.get(sentKey)) continue;

        const log = (doc.state.log as { day: number; member: string; reward: number }[]) || [];
        if (!log.length) continue;
        const maxDay = log.reduce((a, l) => Math.max(a, l.day), -Infinity);
        const week = log.filter((l) => l.day > maxDay - 7);
        if (!week.length) continue;

        const sums = doc.members.map((m) => ({ m, n: week.filter((l) => l.member === m.id).length }));
        const leader = sums.slice().sort((a, b) => b.n - a.n)[0];
        const lines = sums.map((s) => `${s.m.id === leader.m.id && leader.n > 0 ? '👑' : '•'} ${s.m.name}: ${s.n}`).join('\n');
        const text = `Итог недели в вашем доме 🏡\n\nЗакрыто дел: ${week.length}\n${lines}\n\nНовая неделя — новый блеск! 🌱`;

        for (const m of doc.members) {
          await tg(env.BOT_TOKEN, 'sendMessage', {
            chat_id: m.tgId,
            text,
            reply_markup: { inline_keyboard: [[{ text: '🌱 Открыть Кустик', web_app: { url: APP_URL } }]] },
          });
        }
        await env.KV.put(sentKey, '1', { expirationTtl: 8 * 86400 });
        digests++;
      }
      hc = page.list_complete ? undefined : page.cursor;
    } while (hc);
  }

  return json({ ok: true, sent, digests });
};
