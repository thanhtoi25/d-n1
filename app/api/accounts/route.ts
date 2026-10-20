import { NextResponse } from "next/server";
import { route, parseBody } from "@/lib/api";
import { inviteInput, inviteUser, listAccounts } from "@/lib/services/accounts";

export const GET = route("ADMIN", async () => listAccounts());

export const POST = route("ADMIN", async (req, { user }) => {
  const result = await inviteUser(await parseBody(req, inviteInput), user, req.nextUrl.origin);
  return NextResponse.json({ data: result }, { status: 201 });
});
