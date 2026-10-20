import { NextResponse } from "next/server";
import { route, parseBody, parseQuery } from "@/lib/api";
import { announcementInput, announcementListQuery, createAnnouncement, listAnnouncements } from "@/lib/services/announcements";

export const GET = route("MEMBER", async (req, { user }) => listAnnouncements(parseQuery(req, announcementListQuery), user));

export const POST = route("CLASS_OFFICER", async (req, { user }) => {
  const created = await createAnnouncement(await parseBody(req, announcementInput), user);
  return NextResponse.json({ data: created }, { status: 201 });
});
