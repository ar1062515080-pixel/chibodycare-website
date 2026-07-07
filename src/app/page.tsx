import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const treatments = [
  { number: "01", title: "Massage therapy", copy: "Relaxation, remedial and deep recovery treatments tailored to how your body feels today." },
  { number: "02", title: "Acupuncture", copy: "Traditional care delivered in a calm, considered setting by experienced practitioners." },
  { number: "03", title: "Foot & body care", copy: "Restorative sessions designed for tired feet, busy minds and bodies that need a reset." },
];

const gallery = [
  { src: "/images/studio/foot-care-lounge.webp", alt: "Chi Body Care foot care lounge", className: "md:col-span-7 md:row-span-2" },
  { src: "/images/studio/reception-counter.webp", alt: "Cream marble reception counter", className: "md:col-span-5" },
  { src: "/images/studio/hallway-botanical.webp", alt: "Botanical hallway inside Chi Body Care", className: "md:col-span-5" },
];

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <section className="relative min-h-[calc(100svh-5rem)] bg-brown-900 text-cream-50">
        <Image src="/images/studio/studio-exterior.webp" alt="Chi Body Care studio exterior" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(28,20,14,.9)_0%,rgba(28,20,14,.63)_44%,rgba(28,20,14,.12)_76%)]" />
        <div aria-hidden="true" className="absolute -left-36 top-1/2 size-[34rem] -translate-y-1/2 rounded-full border border-gold-light/25" />
        <div aria-hidden="true" className="absolute -left-24 top-1/2 size-[27rem] -translate-y-1/2 rounded-full border border-gold-light/20" />
        <div className="container-page relative flex min-h-[calc(100svh-5rem)] items-center py-20">
          <div className="max-w-2xl animate-fade-up">
            <Image src="/images/chi-logo.png" alt="Chi Body Care" width={1024} height={1024} className="mb-7 size-28 object-contain drop-shadow-2xl sm:size-36" />
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold-light">Massage · Acupuncture · Wellness</p>
            <h1 className="mt-5 text-balance font-serif text-5xl font-medium leading-[.98] sm:text-6xl lg:text-7xl">A quieter place<br />to feel like yourself.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-cream-100/78 sm:text-lg">Step away from the pace of the day. Our Adelaide studios pair experienced care with warm, beautifully considered spaces.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button href="/book" size="lg" variant="secondary">Book Now</Button>
              <Button href="/services" size="lg" variant="ghost" className="border border-cream-50/35 text-cream-50 hover:bg-cream-50/10">View Services</Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-6 right-7 hidden text-right text-[10px] uppercase tracking-[0.2em] text-cream-50/60 md:block"><span className="block text-gold-light">Chi Body Care</span>Real studio, Adelaide</div>
      </section>

      <section className="bg-cream-100 py-20 sm:py-28">
        <div className="container-page">
          <div className="grid gap-10 border-b border-sand-200 pb-14 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div><p className="text-xs uppercase tracking-[0.24em] text-gold-dark">Our care</p><h2 className="mt-4 max-w-md font-serif text-4xl leading-tight text-brown-900 sm:text-5xl">Treatment that begins with listening.</h2></div>
            <p className="max-w-2xl text-base leading-7 text-brown-700/72 lg:justify-self-end">Choose the kind of care you need, the time that suits you and an available practitioner. Every appointment is shaped around comfort, clarity and genuine attention.</p>
          </div>
          <div className="grid lg:grid-cols-3">
            {treatments.map((item) => <Link key={item.number} href="/services" className="group border-b border-sand-200 py-9 transition-colors hover:bg-champagne-light/35 lg:border-b-0 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"><span className="text-xs tracking-[0.2em] text-gold-dark">{item.number}</span><h3 className="mt-5 font-serif text-2xl text-brown-900 group-hover:text-sage-700">{item.title}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-brown-700/68">{item.copy}</p><span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-sage-700">Explore treatments <span aria-hidden="true">→</span></span></Link>)}
          </div>
        </div>
      </section>

      <section className="bg-sage-800 py-20 text-cream-50 sm:py-28">
        <div className="container-page">
          <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div><p className="text-xs uppercase tracking-[0.24em] text-gold-light">Inside Chi</p><h2 className="mt-3 font-serif text-4xl sm:text-5xl">Designed to slow the day down.</h2></div>
            <p className="max-w-md text-sm leading-6 text-cream-100/68">Botanical walls, walnut details, cream stone and soft light create a calm transition from arrival to treatment.</p>
          </div>
          <div className="grid auto-rows-[18rem] gap-4 md:grid-cols-12">
            {gallery.map((image) => <figure key={image.src} className={`group relative overflow-hidden rounded-[1.5rem] ${image.className}`}><Image src={image.src} alt={image.alt} fill sizes="(min-width:768px) 60vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.025]" /></figure>)}
          </div>
        </div>
      </section>

      <section className="bg-cream-50 py-20 sm:py-28">
        <div className="container-page grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="relative mx-auto w-full max-w-xl pb-14 pr-8 sm:pb-20 sm:pr-16">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]"><Image src="/images/studio/treatment-room.webp" alt="Private Chi Body Care treatment room" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" /></div>
            <div className="absolute bottom-0 right-0 aspect-square w-2/5 overflow-hidden rounded-[1.5rem] border-[8px] border-cream-50 shadow-xl"><Image src="/images/studio/botanical-wall-detail.webp" alt="Botanical wall and warm brass lighting" fill sizes="240px" className="object-cover" /></div>
          </div>
          <div className="lg:pl-10">
            <p className="text-xs uppercase tracking-[0.24em] text-gold-dark">Your visit</p>
            <h2 className="mt-4 text-balance font-serif text-4xl leading-tight text-brown-900 sm:text-5xl">Careful treatment.<br />Unhurried atmosphere.</h2>
            <div className="mt-8 space-y-6">
              {[['01','Choose your studio','Find a convenient Chi Body Care location across Adelaide.'],['02','Book around your day','See live availability and select a time online.'],['03','Arrive and unwind','Your practitioner will confirm what you need before treatment begins.']].map(([number,title,copy]) => <div key={number} className="grid grid-cols-[2.5rem_1fr] gap-4 border-t border-sand-200 pt-5"><span className="text-xs text-gold-dark">{number}</span><div><h3 className="font-serif text-xl">{title}</h3><p className="mt-1 text-sm leading-6 text-brown-700/68">{copy}</p></div></div>)}
            </div>
            <div className="mt-9 flex flex-wrap gap-3"><Button href="/book" size="lg">Book an Appointment</Button><Button href="/contact" size="lg" variant="outline">Find a Studio</Button></div>
          </div>
        </div>
      </section>

      <section className="container-page py-8 sm:py-14">
        <div className="relative overflow-hidden rounded-[2rem] bg-brown-900 px-6 py-16 text-center text-cream-50 sm:px-12 sm:py-20">
          <Image src="/images/studio/signage-closeup.webp" alt="Chi Body Care gold signage" fill sizes="100vw" className="object-cover opacity-25" />
          <div className="absolute inset-0 bg-brown-900/65" />
          <div className="relative mx-auto max-w-2xl"><Image src="/images/chi-logo.png" alt="" width={1024} height={1024} className="mx-auto size-24 object-contain" /><h2 className="mt-4 font-serif text-4xl sm:text-5xl">Make space for yourself.</h2><p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-cream-100/72">Book online and choose from available treatments, practitioners and studios.</p><div className="mt-8"><Button href="/book" variant="secondary" size="lg">Book Now</Button></div></div>
        </div>
      </section>
    </main>
  );
}
