// Синхронизация общего дома: pull (без state) и push (со state).
// Простая модель last-write-wins с ревизиями:
//  - push с baseRev == текущей ревизии → принимаем, rev+1;
//  - push с устаревшей baseRev → 409 + актуальный документ (клиент принимает его).
import { Env, PagesContext, err, getHome, json, putHome, validateInitData } from '../_utils';

interface SyncReq {
  initData: string;
  homeId: string;
  baseRev?: number;
  state?: Record<string, unknown>;
}

export const onRequestPost = async (ctx: PagesContext): Promise<Response> => {
  const { request, env } = ctx;
  let body: SyncReq;
  try {
    body = (await request.json()) as SyncReq;
  } catch {
    return err('bad json');
  }
  const user = await validateInitData(body.initData || '', env.BOT_TOKEN);
  if (!user) return err('unauthorized', 401);
  const doc = await getHome(env.KV, (body.homeId || '').trim());
  if (!doc) return err('home not found', 404);
  if (!doc.members.some((m) => m.tgId === user.id)) return err('not a member', 403);

  // Push
  if (body.state && typeof body.state === 'object') {
    if ((body.baseRev ?? -1) === doc.rev) {
      doc.state = body.state;
      // Список участников — источник истины на сервере.
      doc.state.members = doc.members.map((m) => ({ id: m.id, name: m.name, emoji: m.emoji, color: m.color }));
      doc.rev += 1;
      doc.updatedAt = Date.now();
      await putHome(env.KV, body.homeId, doc);
      return json({ ok: true, rev: doc.rev, state: null }); // state не гоняем обратно
    }
    // Конфликт: отдаём актуальное, клиент применяет.
    return json({ ok: false, conflict: true, rev: doc.rev, state: doc.state, members: doc.members }, 409);
  }

  // Pull
  return json({ ok: true, rev: doc.rev, state: doc.state, members: doc.members });
};
