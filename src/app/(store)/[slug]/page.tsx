import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MediaView from "@/components/MediaView";
import Prose from "@/components/Prose";
import TrackForm from "@/components/TrackForm";
import { getPageBySlug, getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPageBySlug(slug);
  return { title: p?.title ?? "Page" };
}

export default async function CmsPage({ params }: Props) {
  const { slug } = await params;
  const [page, settings] = await Promise.all([getPageBySlug(slug), getSettings()]);
  if (!page) notFound();
  const [banner, ...rest] = page.media;
  const isContact = page.slug === "contact";

  return (
    <article className="w-full">
      <header className="grain relative isolate w-full overflow-hidden border-b border-line bg-soft">
        {banner && banner.type === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner.url} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
        <div className="w-full px-4 py-20 sm:px-8 sm:py-28 lg:px-12">
          <p className="anim-up label !mb-3 text-accent">{page.title}</p>
          <h1 className="anim-up font-display max-w-5xl whitespace-pre-line text-5xl font-extrabold leading-[1.05] sm:text-7xl" style={{ animationDelay: "100ms" }}>
            {page.heroHeadline || page.title}
          </h1>
          {page.subtitle && (
            <p className="anim-up mt-5 max-w-2xl text-lg text-muted" style={{ animationDelay: "200ms" }}>
              {page.subtitle}
            </p>
          )}
        </div>
      </header>

      <div className="w-full px-4 py-14 sm:px-8 lg:px-12">
        {isContact && (
          <div className="mb-14 grid w-full gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <TrackForm />
            <div className="rounded-2xl border border-line bg-card p-6 sm:p-8">
              <h2 className="font-display text-2xl font-bold">Contact</h2>
              <ul className="mt-5 space-y-3 text-sm">
                {settings.contactEmail && (
                  <li>
                    <span className="label">Email</span>
                    <a className="text-accent" href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
                  </li>
                )}
                {settings.contactPhone && (
                  <li>
                    <span className="label">Phone</span>
                    {settings.contactPhone}
                  </li>
                )}
                {settings.supportHours && (
                  <li>
                    <span className="label">Hours</span>
                    {settings.supportHours}
                  </li>
                )}
                {settings.contactAddress && (
                  <li>
                    <span className="label">Location</span>
                    {settings.contactAddress}
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {page.body && <Prose text={page.body} className="max-w-4xl text-lg" />}

        {rest.length > 0 && (
          <div className="mt-14 grid w-full grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-5">
            {rest.map((m, i) => (
              <div key={m.url + i} className="group aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-card">
                <MediaView item={m} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              </div>
            ))}
          </div>
        )}
        {banner && banner.type === "video" && (
          <div className="mt-14 aspect-video w-full max-w-5xl overflow-hidden rounded-2xl border border-line">
            <MediaView item={banner} className="h-full w-full" />
          </div>
        )}
      </div>
    </article>
  );
}
