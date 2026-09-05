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
   * Enquiries"), delivering to qualisassurance@gmail.com — independent of the
   * qualisinspections.com site's key, matching the separate-accounts strategy.
   */
  formEndpoint: 'https://api.web3forms.com/submit',
  formAccessKey: 'a41b501f-3917-461c-b783-08f23b1d6747',
  /**
   * Cloudflare Web Analytics beacon token. Public by design, like the form key.
   * Installed manually rather than via Cloudflare's automatic injection: this
   * site is served by a Worker, and Worker responses bypass the proxy's HTML
   * rewriting, so the auto-injected beacon never reached the page (verified —
   * zero occurrences in the live HTML after automatic setup was enabled).
   *
   * REBRAND NOTE: this token is registered against the qualisinspections.com
   * zone in Cloudflare Web Analytics. Once qualisassurance.com exists as a
   * zone, register it there too and swap this token — a mismatched token
   * silently reports zero traffic rather than erroring.
   */
  analyticsToken: '1143a6f279af4bc38364bf03b5df4676',
  /**
   * Google Analytics 4 Measurement ID. Public by design (it ships in the page).
   * Property "qualisassurance.com" under the qualisassurance@gmail.com account.
   * Loaded as gtag.js from googletagmanager.com in BaseLayout's head — unlike
   * the Cloudflare beacon, a plain client-side script tag is served verbatim by
   * the Worker, so it needs no proxy injection. Empty = disabled.
   */
  ga4Id: 'G-3MW9GK3DV8',
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
 * The reference ships three header variants. They differ only in how the
 * "Clusters" item is linked and whether an FAQ item is present.
 *   home    — on-page hash anchors, plus FAQ         (index.html)
 *   service — /#clusters                             (psi, sv, cls, why-independent)
 *   inner   — /clusters/                             (the other 25 pages)
 */
export type NavVariant = 'home' | 'service' | 'inner';

export const NAV: Record<NavVariant, { href: string; label: string }[]> = {
  home: [
    { href: '#services', label: 'Services' },
    { href: '#who', label: 'Who we protect' },
    { href: '#clusters', label: 'Clusters' },
    { href: '#report', label: 'Sample report' },
    { href: '#pricing', label: 'Pricing' },
    { href: '/blog/', label: 'Field Notes' },
    { href: '#faq', label: 'FAQ' },
  ],
  service: [
    { href: '/services/', label: 'Services' },
    { href: '/#who', label: 'Who we protect' },
    { href: '/#clusters', label: 'Clusters' },
    { href: '/sample-reports/', label: 'Sample report' },
    { href: '/#pricing', label: 'Pricing' },
    { href: '/blog/', label: 'Field Notes' },
  ],
  inner: [
    { href: '/services/', label: 'Services' },
    { href: '/#who', label: 'Who we protect' },
    { href: '/clusters/', label: 'Clusters' },
    { href: '/sample-reports/', label: 'Sample report' },
    { href: '/#pricing', label: 'Pricing' },
    { href: '/blog/', label: 'Field Notes' },
  ],
};

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
