import Image from "next/image";

export function BrandLogo() {
  return (
    <Image
      className="brand-logo"
      src="/images/logo-da26ttnt.jpg"
      alt="Logo lớp DA26TTNT AI Elite"
      width={48}
      height={48}
      priority
    />
  );
}
