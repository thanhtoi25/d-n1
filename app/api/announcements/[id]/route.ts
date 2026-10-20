import { route, parseBody } from "@/lib/api";
import {
  announcementUpdate, deleteAnnouncement, getAnnouncement, transitionAnnouncement, transitionSchema, updateAnnouncement,
} from "@/lib/services/announcements";

type P = { id: string };

export const GET = route<P>("MEMBER", async (_req, { user, params }) => getAnnouncement(params.id, user));

export const PATCH = route<P>("CLASS_OFFICER", async (req, { user, params }) =>
  updateAnnouncement(params.id, await parseBody(req, announcementUpdate), user),
);

/** Đổi trạng thái: { "action": "publish" | "archive" | "unpublish" } */
export const POST = route<P>("CLASS_OFFICER", async (req, { user, params }) => {
  const { action } = await parseBody(req, transitionSchema);
  return transitionAnnouncement(params.id, action, user);
});

export const DELETE = route<P>("ADMIN", async (_req, { user, params }) => {
  await deleteAnnouncement(params.id, user);
  return { deleted: true };
});
