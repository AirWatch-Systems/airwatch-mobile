export type Milliseconds = number;

export const FIFTEEN_MIN_MS: Milliseconds = 15 * 60 * 1000;

export function humanizeError(err: Error | null | undefined): string | null {
  if (!err) return null;
  return err.message || "Ocorreu um erro.";
}