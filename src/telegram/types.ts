export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramMessage {
  message_id: number;
  from: { id: number; first_name: string };
  chat: { id: number };
  text?: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: { id: number; first_name: string };
  message: { chat: { id: number }; message_id: number };
  data: string;
}
