import { redirect } from "next/navigation";
import { getCurrentOperator } from "@/lib/auth/current";

export default async function HomePage() {
  const operator = await getCurrentOperator();
  redirect(operator ? "/console" : "/login");
}
