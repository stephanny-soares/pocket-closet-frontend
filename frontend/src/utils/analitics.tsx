import { logEvent } from "../logger/logEvent";

export const logEventAnalytics = async (eventName: string, params?: Record<string, any>) => {
  await logEvent({
    event: eventName,
    message: "Evento de uso registrado",
    extra: params,
  });
};
