import { bootstrapOperator } from "../lib/auth/bootstrap";
import { startWorkerLoop } from "../lib/monitoring/worker";

void bootstrapOperator()
  .then(() => {
    startWorkerLoop();
  })
  .catch((error) => {
    console.error("[pulse-worker] bootstrap failed", error);
    process.exit(1);
  });
