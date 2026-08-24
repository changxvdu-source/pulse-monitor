export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { bootstrapOperator } = await import("@/lib/auth/bootstrap");
    await bootstrapOperator();
  }
}
