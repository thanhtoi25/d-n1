import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Hiển thị rich text an toàn: Markdown rút gọn được dựng thành React element (không dùng dangerouslySetInnerHTML),
 * nên không thể chèn HTML/script. Hỗ trợ: tiêu đề (#, ##), danh sách (- ), **đậm**, *nghiêng*, [liên kết](http/https/mailto).
 */
const INLINE = /(\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\))/g;
const SAFE_URL = /^(https?:\/\/|mailto:|\/(?!\/))/i;

function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0, i = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyPrefix}-${i++}`;
    if (m[2]) out.push(<strong key={key}>{m[2]}</strong>);
    else if (m[3]) out.push(<em key={key}>{m[3]}</em>);
    else if (SAFE_URL.test(m[5])) out.push(m[5].startsWith("/") ? <Link key={key} className="link" href={m[5]}>{m[4]}</Link> : <a key={key} className="link" href={m[5]} target="_blank" rel="noopener noreferrer nofollow">{m[4]}</a>);
    else out.push(m[0]);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function RichText({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/).filter((b) => b.trim());
  return <div className="prose">{blocks.map((block, bi) => {
    const lines = block.split("\n");
    if (lines.every((l) => /^\s*[-*]\s+/.test(l)))
      return <ul key={bi}>{lines.map((l, li) => <li key={li}>{inline(l.replace(/^\s*[-*]\s+/, ""), `${bi}-${li}`)}</li>)}</ul>;
    const h = /^(#{1,2})\s+(.*)$/.exec(block.trim());
    if (h && lines.length === 1) return h[1].length === 1 ? <h3 key={bi}>{inline(h[2], `${bi}`)}</h3> : <h4 key={bi}>{inline(h[2], `${bi}`)}</h4>;
    return <p key={bi}>{lines.map((l, li) => <span key={li}>{li > 0 && <br/>}{inline(l, `${bi}-${li}`)}</span>)}</p>;
  })}</div>;
}
