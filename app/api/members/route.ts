import { NextResponse } from "next/server";
import { route, parseBody, parseQuery } from "@/lib/api";
import { createMember, listMembers, memberInput, memberListQuery } from "@/lib/services/members";

export const GET = route("MEMBER", async (req, { user }) => listMembers(parseQuery(req, memberListQuery), user));

export const POST = route("ADMIN", async (req, { user }) => {
  const created = await createMember(await parseBody(req, memberInput), user);
  return NextResponse.json({ data: created }, { status: 201 });
});
