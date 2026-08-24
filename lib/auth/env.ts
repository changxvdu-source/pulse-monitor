export function requireAuthEnv() {
  const email = process.env.OPERATOR_EMAIL?.trim();
  const password = process.env.OPERATOR_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET?.trim();

  if (!email) {
    throw new Error("OPERATOR_EMAIL is required");
  }
  if (!password) {
    throw new Error("OPERATOR_PASSWORD is required");
  }
  if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters");
  }

  return { email, password, sessionSecret };
}
