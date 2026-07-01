// Создать общий дом: текущее состояние создателя становится общим.
import { Env, PagesContext, err, json, memberFor, newHomeId, putHome, validateInitData } from '../_utils';

interface CreateReq {
  initData: string;
  state: Record<string, unknown>;
}

export const onRequestPost = async (ctx: PagesContext): Promise<Response> => {
  const { request, env } = ctx;
  let body: CreateReq;
  try {
    body = (await request.json()) as CreateReq;
  } catch {
    return err('bad json');
  }
  const user = await validateInitData(body.initData || '', env.BOT_TOKEN);
  if (!user) return err('unauthorized', 401);
  if (!body.state || typeof body.state !== 'object') return err('no state');

  const homeId = newHomeId();
  const member = memberFor(user, []);
  const doc = {
    rev: 1,
    updatedAt: Date.now(),
    members: [member],
    state: body.state,
  };
  await putHome(env.KV, homeId, doc);
  return json({ ok: true, homeId, member, members: doc.members, rev: doc.rev });
};
