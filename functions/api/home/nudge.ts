// «Подтолкнуть» соседа по общему дому — бот шлёт ему тёплое напоминание в личку.
// Rate-limit: одному человеку не чаще раза в 2 часа (чтобы не спамили).
import { Env, PagesContext, err, getHome, json, tg, validateInitData } from '../_utils';

const APP_URL = 'https://kustik.pages.dev';
const COOLDOWN_MS = 2 * 60 * 60 * 1000;

interface NudgeReq {
  initData: string;
  homeId: string;
  targetId: string; // id участника ('tg<userId>')
}

export const onRequestPost = async (ctx: PagesContext): Promise<Response> => {
  const { request, env } = ctx;
  let body: NudgeReq;
  try {
    body = (await request.json()) as NudgeReq;
  } catch {
    return err('bad json');
  }
  const user = await validateInitData(body.initData || '', env.BOT_TOKEN);
  if (!user) return err('unauthorized', 401);

  const doc = await getHome(env.KV, (body.homeId || '').trim());
  if (!doc) return err('home not found', 404);
  const sender = doc.members.find((m) => m.tgId === user.id);
  if (!sender) return err('not a member', 403);
  const target = doc.members.find((m) => m.id === body.targetId);
  if (!target || target.tgId === user.id) return err('bad target', 400);

  // Антиспам.
  const rlKey = `nudge:${body.homeId}:${target.id}`;
  if (await env.KV.get(rlKey)) return json({ ok: true, throttled: true });

  await tg(env.BOT_TOKEN, 'sendMessage', {
    chat_id: target.tgId,
    text: `${sender.name} зовёт помочь Кустику 🌱\nЗагляни в общий дом — там ждут дела ✨`,
    reply_markup: { inline_keyboard: [[{ text: '🌱 Открыть Кустик', web_app: { url: APP_URL } }]] },
  });
  await env.KV.put(rlKey, '1', { expirationTtl: Math.floor(COOLDOWN_MS / 1000) });

  return json({ ok: true, throttled: false });
};
