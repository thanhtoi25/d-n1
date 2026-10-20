import { route, parseBody } from "@/lib/api";
import { accountAction, accountUpdate, reinvite, updateAccount } from "@/lib/services/accounts";

type P = { id: string };

export const PATCH = route<P>("ADMIN", async (req, { user, params }) => updateAccount(params.id, await parseBody(req, accountUpdate), user));

/** Gửi lại lời mời: { "action": "reinvite" } */
export const POST = route<P>("ADMIN", async (req, { user, params }) => {
  await parseBody(req, accountAction);
  return reinvite(params.id, user, req.nextUrl.origin);
});
