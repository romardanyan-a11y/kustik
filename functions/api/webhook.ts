// Вебхук Telegram-бота: /start, /help.
import { Env, PagesContext, err, json, tg } from './_utils';

const APP_URL = 'https://kustik.pages.dev';

interface TgUpdate {
  message?: {
    text?: string;
    chat: { id: number };
    from?: { first_name?: string };
  };
}

export const onRequestPost = async (ctx: PagesContext): Promise<Response> => {
  const { request, env } = ctx;
  // Telegram подписывает вебхук заголовком-секретом (задаётся в setWebhook).
  const secret = request.headers.get('x-telegram-bot-api-secret-token');
  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) return err('forbidden', 403);

  let update: TgUpdate;
  try {
    update = (await request.json()) as TgUpdate;
  } catch {
    return err('bad json');
  }

  const msg = update.message;
  if (!msg?.text) return json({ ok: true });
  const chatId = msg.chat.id;
  const name = msg.from?.first_name || 'друг';

  const openButton = {
    inline_keyboard: [[{ text: '🌱 Открыть Кустик', web_app: { url: APP_URL } }]],
  };

  if (msg.text.startsWith('/start')) {
    await tg(env.BOT_TOKEN, 'sendMessage', {
      chat_id: chatId,
      text:
        `Привет, ${name}! Я Кустик — твой питомец-растение 🌱\n\n` +
        `Я цвету, когда дома чисто, и грущу, когда всё запущено. ` +
        `Помогай мне по чуть-чуть каждый день — без списков-простыней и чувства вины.\n\n` +
        `Жми кнопку и поехали!`,
      reply_markup: openButton,
    });
  } else if (msg.text.startsWith('/help')) {
    await tg(env.BOT_TOKEN, 'sendMessage', {
      chat_id: chatId,
      text:
        `Как это работает:\n\n` +
        `🌿 У каждого дела своя частота: посуда — каждый день, душ — раз в неделю.\n` +
        `📋 Каждый день я показываю только то, что пора сделать.\n` +
        `✨ За дела — искры, серия и уровни. Искры тратятся в магазинчике.\n` +
        `👨‍👩‍👧 Можно убираться вдвоём или всей семьёй — дела распределяются по очереди.\n\n` +
        `Пропустишь день — ничего не сгорит. Завтра просто будет на пару дел больше.`,
      reply_markup: openButton,
    });
  }

  return json({ ok: true });
};
