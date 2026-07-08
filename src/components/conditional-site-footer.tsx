"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";

const pagesWithoutFooter = new Set(["/services", "/about", "/contact"]);

export function ConditionalSiteFooter() {
  const pathname = usePathname();

  if (pagesWithoutFooter.has(pathname)) return null;

  return <SiteFooter flush={pathname === "/" || pathname.startsWith("/admin")} />;
}
