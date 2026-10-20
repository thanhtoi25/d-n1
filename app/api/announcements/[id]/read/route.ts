import { route } from "@/lib/api";
import { markRead } from "@/lib/services/announcements";

export const POST = route<{ id: string }>("MEMBER", async (_req, { user, params }) => markRead(params.id, user));
