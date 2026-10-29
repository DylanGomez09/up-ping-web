export interface ApiEnvelope<T> {
  data: T;
}

export interface ApiErrorDetail {
  detail: string;
}

export type ApiErrorPayload = ApiErrorDetail | ApiErrorDetail[];

export interface CursorPage<T> {
  items: T[];
  next_cursor: string | null;
  /** Total rows on the server, when the backend reports it. */
  total?: number;
}