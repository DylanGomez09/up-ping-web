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
}