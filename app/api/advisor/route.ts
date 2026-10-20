import { route, parseBody } from "@/lib/api";
import { advisorInput, getAdvisor, saveAdvisor } from "@/lib/services/advisor";

export const GET = route("MEMBER", async () => getAdvisor());
export const PUT = route("ADMIN", async (req, { user }) => saveAdvisor(await parseBody(req, advisorInput), user));
