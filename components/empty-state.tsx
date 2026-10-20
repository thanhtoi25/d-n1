import { Inbox } from "lucide-react";
export function EmptyState({ title="Chưa có dữ liệu", detail="Nội dung sẽ xuất hiện tại đây sau khi được cập nhật." }: { title?: string; detail?: string }) {
  return <div className="empty"><div><Inbox size={30}/><strong>{title}</strong><span>{detail}</span></div></div>
}
