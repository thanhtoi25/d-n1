import { route, parseBody } from "@/lib/api";
import { deleteMember, getMember, memberUpdate, updateMember } from "@/lib/services/members";

type P = { id: string };

export const GET = route<P>("MEMBER", async (_req, { user, params }) => getMember(params.id, user));

// Quyền chi tiết (admin sửa tất cả, thành viên chỉ sửa hồ sơ mình) được kiểm tra trong service.
export const PATCH = route<P>("MEMBER", async (req, { user, params }) =>
  updateMember(params.id, await parseBody(req, memberUpdate), user),
);

export const DELETE = route<P>("ADMIN", async (_req, { user, params }) => {
  await deleteMember(params.id, user);
  return { deleted: true };
});
