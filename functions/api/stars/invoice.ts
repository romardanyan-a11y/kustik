// Выставить счёт в Telegram Stars за премиум-товар.
// Каталог и цены живут на сервере — клиенту не доверяем.
import { Env, PagesContext, err, json, tg, validateInitData } from '../_utils';

export const PREMIUM_CATALOG: Record<string, { title: string; description: string; stars: number }> = {
  pot_gold: {
    title: 'Золотой горшок',
    description: 'Сияющий золотой горшок для кустика — с искорками ✨',
    stars: 25,
  },
};

interface InvoiceReq {
  initData: string;
  itemId: string;
}

export const onRequestPost = async (ctx: PagesContext): Promise<Response> => {
  const { request, env } = ctx;
  let body: InvoiceReq;
  try {
    body = (await request.json()) as InvoiceReq;
  } catch {
    return err('bad json');
  }
  const user = await validateInitData(body.initData || '', env.BOT_TOKEN);
  if (!user) return err('unauthorized', 401);
  const item = PREMIUM_CATALOG[body.itemId];
  if (!item) return err('unknown item', 404);

  // Уже куплено — счёт не нужен.
  if (await env.KV.get(`star:${user.id}:${body.itemId}`)) {
    return json({ ok: true, alreadyOwned: true });
  }

  const res = (await tg(env.BOT_TOKEN, 'createInvoiceLink', {
    title: item.title,
    description: item.description,
    payload: `${user.id}:${body.itemId}`,
    currency: 'XTR', // Telegram Stars
    prices: [{ label: item.title, amount: item.stars }],
  })) as { ok: boolean; result?: string };

  if (!res.ok || !res.result) return err('invoice failed', 502);
  return json({ ok: true, link: res.result });
};
