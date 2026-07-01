// Забрать оплаченные Stars-покупки (восстановление на любом устройстве).
import { Env, PagesContext, err, json, validateInitData } from '../_utils';

interface ClaimReq {
  initData: string;
}

export const onRequestPost = async (ctx: PagesContext): Promise<Response> => {
  const { request, env } = ctx;
  let body: ClaimReq;
  try {
    body = (await request.json()) as ClaimReq;
  } catch {
    return err('bad json');
  }
  const user = await validateInitData(body.initData || '', env.BOT_TOKEN);
  if (!user) return err('unauthorized', 401);

  const prefix = `star:${user.id}:`;
  const items: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.KV.list({ prefix, cursor });
    page.keys.forEach((k) => items.push(k.name.slice(prefix.length)));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  return json({ ok: true, items });
};
