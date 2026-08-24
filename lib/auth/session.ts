import { createHmac, timingSafeEqual } from "node:crypto";

type SessionPayload = {
  operatorId: string;
};

export function createSessionToken(input: {
  operatorId: string;
  secret: string;
}): string {
  const body = Buffer.from(
    JSON.stringify({ operatorId: input.operatorId } satisfies SessionPayload),
  ).toString("base64url");
  const signature = sign(body, input.secret);
  return `${body}.${signature}`;
}

export function verifySessionToken(input: {
  token: string;
  secret: string;
}): SessionPayload | null {
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
    ) as SessionPayload;
    if (typeof parsed.operatorId !== "string" || !parsed.operatorId) {
      return null;
    }
    return { operatorId: parsed.operatorId };
  } catch {
    return null;
  }
}

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}
