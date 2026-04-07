/** Thrown when sendMessage returns a non-OK response; `httpStatus` set when a response was received. */
export class TelegramSendError extends Error {
  constructor(
    message: string,
    readonly httpStatus?: number,
  ) {
    super(message);
    this.name = "TelegramSendError";
  }
}

export function isRetryableTelegramError(e: unknown): boolean {
  if (e instanceof TelegramSendError) {
    if (e.httpStatus === undefined) return true;
    return e.httpStatus === 429 || e.httpStatus >= 500;
  }
  return true;
}
