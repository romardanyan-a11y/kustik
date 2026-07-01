// Присоединиться к общему дому по приглашению (startapp=h_<homeId>).
import { Env, PagesContext, err, getHome, json, memberFor, putHome, validateInitData } from '../_utils';

interface JoinReq {
  initData: string;
  homeId: string;
}

const MAX_MEMBERS = 6;

export const onRequestPost = async (ctx: PagesContext): Promise<Response> => {
  const { request, env } = ctx;
  let body: JoinReq;
  try {
    body = (await request.json()) as JoinReq;
  } catch {
    return err('bad json');
  }
  const user = await validateInitData(body.initData || '', env.BOT_TOKEN);
  if (!user) return err('unauthorized', 401);
  const homeId = (body.homeId || '').trim();
  const doc = await getHome(env.KV, homeId);
  if (!doc) return err('home not found', 404);

  let member = doc.members.find((m) => m.tgId === user.id);
  if (!member) {
    if (doc.members.length >= MAX_MEMBERS) return err('home is full', 409);
    member = memberFor(user, doc.members);
    doc.members.push(member);
    doc.rev += 1;
    doc.updatedAt = Date.now();
    // Участники дублируются в общий стейт (его читает движок ротации).
    if (doc.state) {
      doc.state.members = doc.members.map((m) => ({ id: m.id, name: m.name, emoji: m.emoji, color: m.color }));
      doc.state.mode = doc.members.length <= 1 ? 'one' : doc.members.length === 2 ? 'duo' : 'family';
    }
    await putHome(env.KV, homeId, doc);
  }

  return json({ ok: true, homeId, member, members: doc.members, state: doc.state, rev: doc.rev });
};
