// Регистрация ежедневного напоминания. Клиент шлёт настройки при изменении.
import { Env, PagesContext, err, json, validateInitData } from './_utils';

interface ReminderReq {
  initData: string;
  on: boolean;
  hour: number; // локальный час пользователя, 0-23
  tzMin: number; // смещение от UTC в минутах на восток (например, МСК = 180)
}

export const onRequestPost = async (ctx: PagesContext): Promise<Response> => {
  const { request, env } = ctx;
  let body: ReminderReq;
  try {
    body = (await request.json()) as ReminderReq;
  } catch {
    return err('bad json');
  }
  const user = await validateInitData(body.initData || '', env.BOT_TOKEN);
  if (!user) return err('unauthorized', 401);

  const key = `rem:${user.id}`;
  if (!body.on) {
    await env.KV.delete(key);
    return json({ ok: true, on: false });
  }
  const hour = Math.max(0, Math.min(23, Math.round(body.hour ?? 9)));
  const tzMin = Math.max(-840, Math.min(840, Math.round(body.tzMin ?? 0)));
  await env.KV.put(key, JSON.stringify({ chatId: user.id, hour, tzMin, name: user.first_name }));
  return json({ ok: true, on: true, hour });
};
