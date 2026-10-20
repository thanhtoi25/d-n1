import { NextResponse } from "next/server";
import { route, parseBody } from "@/lib/api";
import { addPosition, listPositions, positionInput } from "@/lib/services/advisor";

export const GET = route("MEMBER", async () => listPositions());
export const POST = route("ADMIN", async (req, { user }) =>
  NextResponse.json({ data: await addPosition(await parseBody(req, positionInput), user) }, { status: 201 }),
);
