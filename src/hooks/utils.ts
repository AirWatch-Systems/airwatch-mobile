import type { ApiError } from "../services/api";

/**
 * Friendly error messages for common scenarios (RF13)
 */
export function humanizeError(err: ApiError | Error | null | undefined): string | null {
  if (!err) return null;
  const message = err.message || "Ocorreu um erro.";

  // Customize messages based on error content
  if (message.includes("Invalid credentials") || message.includes("credenciais")) {
    return "Dados inválidos";
  }
  if (message.includes("Email already in use") || message.includes("usuário já existe")) {
    return "Já tem um usuário cadastrado com aquele email";
  }

  return message;
}