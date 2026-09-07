/** Site-wide constants. Values mirror the static reference exactly. */
export const SITE = {
  url: 'https://qualisassurance.com',
  name: 'QUALIS',
  siteName: 'QUALIS',
  locale: 'en_US',
  themeColor: '#F7F6F2',
  defaultOgImage: 'https://qualisassurance.com/images/og-qualis-1200x630.jpg',
  /** Self-hosted in public/fonts. Regenerate by refetching this URL with a
   *  modern browser UA and re-running the localisation step (see fonts.css). */
  fontsSource:
    'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap',
  fontsHref: '/fonts/fonts.css',
  /** Contact points. `waNumber` is digits-only for wa.me; `phoneE164` for tel:. */
  phoneDisplay: '+91 844 000 7574',
  phoneE164: '+918440007574',
  waNumber: '918440007574',
  email: 'info@qualisassurance.com',
  /** Registered office. Kept consistent for NAP (name/address/phone) across the
   *  site footer and JSON-LD PostalAddress. */
  addressStreet: 'C-10, Saraswati Nagar Main Rd, M.I.A. 1st Phase, Basni, Madhuban',
  addressLocality: 'Jodhpur',
  addressRegion: 'Rajasthan',
  postalCode: '342001',
  addressFull:
    'C-10, Saraswati Nagar Main Rd, M.I.A. 1st Phase, Basni, Madhuban, Jodhpur, Rajasthan 342001',
  /**
   * Form backend for booking enquiries. Web3Forms delivers straight to the
   * address the key was verified against; the access key is public by design
   * (it is embedded in the page and can only ever deliver to that one address),
   * so it is not a secret and belongs in the repo.
   *
   * Empty key = disabled: the forms fall back to WhatsApp only, exactly as
   * before, and nothing on the page changes. Paste the key to switch capture on.
   *
   * This key is its own Web3Forms account/form ("Qualis Assurance —
   * Enquiries"), delivering to yogesh.qualis@gmail.com (the owner-controlled
   * inbox; the old qualisassurance@gmail.com account was lost in 2026-09).
   */
  formEndpoint: 'https://api.web3forms.com/submit',
  formAccessKey: '5f305af2-a8f0-41b6-9050-182d91fc5341',
  /**
   * Google Analytics 4 Measurement ID. Public by design (it ships in the page).
   * Property "Qualis Assurance" (stream qualisassurance.com) under the
   * yogesh.qualis@gmail.com account. Replaced the orphaned G-3MW9GK3DV8, which
   * was stuck under the lost qualisassurance@gmail.com Google account (2026-09).
   * Loaded as gtag.js from googletagmanager.com in BaseLayout's head — unlike
   * the Cloudflare beacon, a plain client-side script tag is served verbatim by
   * the Worker, so it needs no proxy injection. Empty = disabled.
   */
  ga4Id: 'G-N4X0DBRC1H',
} as const;

/**
 * Buyer markets, in the order the footer prints them. Single source of truth:
 * the footer and llms.txt both read this. They drifted once already — three
 * markets were added to the footer while llms.txt kept advertising the old
 * seven. The porter holds the ISO-code form of this same list (SERVED in
 * tools/port-reference.mjs) for the areaServed graph; keep the two in step.
 */
export const MARKETS = [
  'USA', 'Canada', 'UK', 'Australia', 'Germany',
  'Netherlands', 'Belgium', 'France', 'Denmark', 'UAE',
] as const;

/** Pre-filled WhatsApp link. `text` is encoded by the caller. */
export const waLink = (text?: string) =>
  `https://wa.me/${SITE.waNumber}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

/**
 * Header link sets. Three variants remain because the home page links its own
 * on-page sections by hash; `service` and `inner` are now identical and are
 * both kept only so existing `navVariant` props keep type-checking.
 *
 * 2026-09 audit changes: "Why independent" (the Independence Charter, the whole
 * positioning) and "Contact" were footer-only — /contact/ had no in-body inbound
 * link anywhere on the site. They are now in the header on every page. "Who we
 * protect" and "FAQ" came out to hold the row at seven items: the audience grid
 * still lives on /services/ and the home page, and the FAQ item pointed at a
 * home anchor that simply vanished on every inner page. "Clusters" now goes to
 * the /clusters/ hub off-home instead of bouncing back to a home anchor.
 */
export type NavVariant = 'home' | 'service' | 'inner';

/** Off-home header: every item is a real page except the pricing anchor. */
const NAV_PAGES = [
  { href: '/services/', label: 'Services' },
  { href: '/clusters/', label: 'Clusters' },
  { href: '/why-independent/', label: 'Why independent' },
  { href: '/sample-reports/', label: 'Sample report' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/blog/', label: 'Field Notes' },
  { href: '/contact/', label: 'Contact' },
] as const;

export const NAV: Record<NavVariant, readonly { href: string; label: string }[]> = {
  home: [
    { href: '#services', label: 'Services' },
    { href: '#clusters', label: 'Clusters' },
    { href: '/why-independent/', label: 'Why independent' },
    { href: '#report', label: 'Sample report' },
    { href: '#pricing', label: 'Pricing' },
    { href: '/blog/', label: 'Field Notes' },
    { href: '/contact/', label: 'Contact' },
  ],
  service: NAV_PAGES,
  inner: NAV_PAGES,
};

/**
 * Public profiles. Single source of truth for the footer links and the schema
 * `sameAs` array. Every URL here was checked to return 200 — a dead profile in
 * `sameAs` is worse than omitting it. The Google entry is the Maps place link,
 * not the `share.google` shortcut, which resolves to a search results page.
 */
export const SOCIAL_LINKS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/qualisassurance/' },
  { label: 'Instagram', href: 'https://www.instagram.com/qualisassurance/' },
  { label: 'Facebook', href: 'https://www.facebook.com/QualisAssurance' },
  { label: 'Google', href: 'https://maps.app.goo.gl/bdA2qD15SzmagDnXA' },
] as const;

/**
 * The six buyer audiences, in the order the homepage "Who we protect" grid
 * prints them. Read by AudienceLinks.astro, which cross-links them from each
 * other and from /services/. `label` carries an entity because it is rendered
 * with set:html — see the component.
 */
export const AUDIENCES = [
  { slug: 'importers', label: 'Importers &amp; wholesalers', blurb: 'Container-level assurance and repeat-order monitoring.' },
  { slug: 'retail-chains', label: 'Retail chains', blurb: 'Vendor programmes, AQL alignment and audit trails for your QA team.' },
  { slug: 'brands', label: 'Furniture brands &amp; DTC', blurb: 'Spec enforcement from golden sample to sealed container.' },
  { slug: 'ecommerce', label: 'E-commerce sellers', blurb: 'ISTA packaging validation to cut transit-damage returns.' },
  { slug: 'projects', label: 'Interior &amp; hospitality projects', blurb: 'FF&amp;E inspection against project specifications and deadlines.' },
  { slug: 'procurement', label: 'Procurement teams', blurb: 'Independent eyes and documented evidence for every India PO.' },
] as const;

export const FOOTER_COLUMNS = [
  {
    heading: 'Services',
    links: [
      { href: '/pre-shipment-inspection-india/', label: 'Pre-Shipment Inspection' },
      { href: '/supplier-verification-india/', label: 'Supplier Verification' },
      { href: '/factory-audit-india/', label: 'Factory Audit' },
      { href: '/container-loading-supervision/', label: 'Container Loading' },
      { href: '/production-monitoring-india/', label: 'Production Monitoring' },
      { href: '/first-order-shield/', label: 'First Order Shield' },
    ],
  },
  {
    heading: 'Clusters',
    links: [
      { href: '/clusters/jodhpur/', label: 'Jodhpur' },
      { href: '/clusters/jaipur/', label: 'Jaipur' },
      { href: '/clusters/saharanpur/', label: 'Saharanpur' },
      { href: '/clusters/moradabad/', label: 'Moradabad' },
      { href: '/clusters/delhi-ncr/', label: 'Delhi NCR' },
      { href: '/clusters/kolkata/', label: 'Kolkata' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { href: '/blog/', label: 'Field Notes' },
      { href: '/defects/', label: 'Defect Library' },
      { href: '/sample-reports/', label: 'Sample Reports' },
      { href: '/import-compliance/', label: 'Import Compliance' },
      { href: '/eudr-compliance-india-furniture/', label: 'EUDR Compliance' },
      { href: '/eudr-supplier-evidence-review/', label: 'EUDR Evidence Review' },
      { href: '/academy/', label: 'Import Academy' },
      { href: '/why-independent/', label: 'Why Independent' },
      { href: '/contact/', label: 'Contact' },
    ],
  },
  {
    heading: 'Import Guides',
    links: [
      { href: '/importing-furniture-from-india/', label: 'All markets' },
      { href: '/importing-furniture-from-india/usa/', label: 'USA' },
      { href: '/importing-furniture-from-india/uk/', label: 'UK' },
      { href: '/importing-furniture-from-india/germany/', label: 'Germany' },
      { href: '/importing-furniture-from-india/netherlands/', label: 'Netherlands' },
      { href: '/importing-furniture-from-india/france/', label: 'France' },
      { href: '/importing-furniture-from-india/spain/', label: 'Spain' },
      { href: '/importing-furniture-from-india/canada/', label: 'Canada' },
      { href: '/importing-furniture-from-india/australia/', label: 'Australia' },
      { href: '/importing-furniture-from-india/uae/', label: 'UAE & GCC' },
      { href: '/importing-furniture-from-india/saudi-arabia/', label: 'Saudi Arabia' },
    ],
  },
] as const;
