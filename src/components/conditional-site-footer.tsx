"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";

const pagesWithoutFooter = ["/services", "/about", "/contact", "/book", "/booking"];

export function ConditionalSiteFooter() {
  const pathname = usePathname();

  if (pagesWithoutFooter.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return null;

  return <SiteFooter flush={pathname === "/" || pathname.startsWith("/admin")} />;
}
