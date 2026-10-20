import { route } from "@/lib/api";
import { removePosition } from "@/lib/services/advisor";

export const DELETE = route<{ id: string }>("ADMIN", async (_req, { user, params }) => {
  await removePosition(params.id, user);
  return { deleted: true };
});
