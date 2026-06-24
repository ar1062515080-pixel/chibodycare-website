import { staff } from "@/lib/staff";
import { SectionHeading } from "@/components/ui/section-heading";
import { TeamCard } from "@/components/team-card";
import { Button } from "@/components/ui/button";

export function TeamPreview() {
  const preview = staff.slice(0, 4);

  return (
    <section className="bg-sand-50/60 py-16 sm:py-20">
      <div className="container-page">
        <SectionHeading
          eyebrow="Meet the Team"
          title="Caring hands, expert care"
          description="Our practitioners bring years of experience and a genuine passion for helping you feel your best."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {preview.map((member) => (
            <TeamCard key={member.id} member={member} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button href="/about" variant="outline" size="md">
            Meet the full team
          </Button>
        </div>
      </div>
    </section>
  );
}
