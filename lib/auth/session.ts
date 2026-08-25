import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

type SessionPayload = {
  operatorId: string;
  exp: number;
};

export function createSessionToken(input: {
  operatorId: string;
  secret: string;
  now?: number;
}): string {
  const nowMs = input.now ?? Date.now();
  const body = Buffer.from(
    JSON.stringify({
      operatorId: input.operatorId,
      exp: Math.floor(nowMs / 1000) + SESSION_MAX_AGE_SECONDS,
    } satisfies SessionPayload),
  ).toString("base64url");
  const signature = sign(body, input.secret);
  return `${body}.${signature}`;
}

export function verifySessionToken(input: {
  token: string;
  secret: string;
  now?: number;
}): { operatorId: string } | null {
  const [body, signature] = input.token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body, input.secret);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as Partial<SessionPayload>;
    if (typeof parsed.operatorId !== "string" || !parsed.operatorId) {
      return null;
    }
    if (typeof parsed.exp !== "number" || !Number.isFinite(parsed.exp)) {
      return null;
    }
    const nowSeconds = Math.floor((input.now ?? Date.now()) / 1000);
    if (parsed.exp <= nowSeconds) return null;
    return { operatorId: parsed.operatorId };
  } catch {
    return null;
  }
}

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}
