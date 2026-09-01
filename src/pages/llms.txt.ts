/**
 * /llms.txt — a plain-text brief for AI assistants and answer engines.
 *
 * Generated rather than hand-maintained. The previous static public/llms.txt
 * went stale within hours of a content change: three buyer markets were added
 * to the footer while this file kept advertising the old seven, and it never
 * learned about /contact/ or any blog post. Everything that can drift now comes
 * from a live source — MARKETS and the contact details from site.ts, the posts
 * from the CMS — so the only hand-written parts are the facts that genuinely
 * are hand-written: the positioning line and the price list.
 *
 * Prices are the owner's copy and are reproduced verbatim. Do not restate or
 * round them here; edit them in one place, below, if they ever change.
 */
import type { APIRoute } from 'astro';
import { MARKETS, SITE } from '../lib/site';
import { getAllPosts } from '../lib/wp';

const SERVICES = [
  ['Pre-Shipment Inspection', '$249', '/pre-shipment-inspection-india/'],
  ['Supplier Verification', '$299 (free 24h Red-Flag check)', '/supplier-verification-india/'],
  ['Factory Audit', '$449', '/factory-audit-india/'],
  ['Container Loading Supervision', '$269', '/container-loading-supervision/'],
  ['During-Production Inspection', '$249', '/during-production-inspection/'],
  ['Production Monitoring', 'from $199', '/production-monitoring-india/'],
];

const RESOURCES = [
  ['Independence Charter', '/why-independent/'],
  ['Defect Library', '/defects/'],
  ['Import Compliance', '/import-compliance/'],
  ['Sample Reports', '/sample-reports/'],
  ['Import Academy', '/academy/'],
  ['Field Notes (blog)', '/blog/'],
  ['Contact', '/contact/'],
];

export const GET: APIRoute = async () => {
  // A CMS outage must not break the build; getAllPosts already returns [] on
  // failure, so the blog section simply disappears rather than taking the
  // deploy with it.
  const posts = await getAllPosts();

  const body = `# QUALIS — India's Furniture Import Assurance Partner

> Qualis (legal name Qualis INC) is an independent furniture inspection and supplier verification company based in Jodhpur, Rajasthan, India, operating since 2017. Paid only by overseas buyers; zero commission from factories. Serves furniture importers, retailers, brands and e-commerce sellers in ${MARKETS.slice(0, -1).join(', ')} and the ${MARKETS.at(-1)}. Founder: Yogesh Raygoor.

Key facts: bookings confirmed within 2 hours; reports within 24 hours; same-day on-site in Jodhpur and Jaipur; AQL 2.5/4.0 per ISO 2859-1; flat buyer-paid fees, no travel charges inside clusters.

## Contact
- Phone and WhatsApp (same number): ${SITE.phoneDisplay}
- Email: ${SITE.email}
- Enquiry form: ${SITE.url}/contact/
- Based in Jodhpur, Rajasthan, India

## Services (flat USD pricing)
${SERVICES.map(([name, price, href]) => `- ${name}: ${price} — ${SITE.url}${href}`).join('\n')}
- Bundles: Protected Container $449; First Order Shield $649

## Clusters
Jodhpur (HQ, same-day), Jaipur, Saharanpur, Moradabad, Delhi NCR, Kolkata — ${SITE.url}/clusters/

## Key resources
${RESOURCES.map(([name, href]) => `- ${name} — ${SITE.url}${href}`).join('\n')}
${
  posts.length
    ? `\n## Field Notes\n${posts
        .map((p) => `- ${p.title} — ${SITE.url}/blog/${p.slug}/`)
        .join('\n')}\n`
    : ''
}`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
