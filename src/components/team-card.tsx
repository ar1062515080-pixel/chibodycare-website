import type { StaffMember } from "@/lib/staff";
import { cn } from "@/lib/cn";

export function TeamCard({
  member,
  detailed = false,
}: {
  member: StaffMember;
  detailed?: boolean;
}) {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-sand-100 bg-cream-50 p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div
        className={cn(
          "mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br text-2xl font-serif font-semibold text-cream-50 shadow-inner",
          member.accent,
        )}
        aria-hidden="true"
      >
        {member.initials}
      </div>
      <h3 className="mt-4 font-serif text-xl font-medium text-brown-900">
        {member.name}
      </h3>
      <p className="mt-1 text-sm font-medium text-gold-dark">{member.title}</p>
      {detailed ? (
        <p className="mt-3 text-sm leading-relaxed text-brown-700/80">
          {member.bio}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {member.focus.map((item) => (
          <span
            key={item}
            className="rounded-full bg-sage-50 px-3 py-1 text-xs font-medium text-sage-700"
          >
            {item}
          </span>
        ))}
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-brown-700/50">
        {member.yearsExperience}+ years experience
      </p>
    </div>
  );
}
