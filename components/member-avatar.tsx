import Image from "next/image";
import { initials } from "@/lib/utils";

export function MemberAvatar({
  name,
  avatarUrl,
  size = 40,
  className = "",
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`avatar member-photo ${className}`} style={{ width: size, height: size }}>
      {avatarUrl ? (
        <Image
          unoptimized
          src={avatarUrl}
          alt={`Ảnh đại diện ${name}`}
          width={size}
          height={size}
        />
      ) : initials(name)}
    </span>
  );
}
