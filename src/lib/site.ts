/** Site-wide constants. Values mirror the static reference exactly. */
export const SITE = {
  url: 'https://qualisinspections.com',
  name: 'QUALIS',
  siteName: 'QUALIS',
  locale: 'en_US',
  themeColor: '#F7F6F2',
  defaultOgImage: 'https://qualisinspections.com/images/og-qualis-1200x630.jpg',
  /** Self-hosted in public/fonts. Regenerate by refetching this URL with a
   *  modern browser UA and re-running the localisation step (see fonts.css). */
  fontsSource:
    'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap',
  fontsHref: '/fonts/fonts.css',
  /** Contact points. `waNumber` is digits-only for wa.me; `phoneE164` for tel:. */
  phoneDisplay: '+91 844 000 7574',
  phoneE164: '+918440007574',
  waNumber: '918440007574',
  email: 'info@qualisinspections.com',
  /**
   * Form backend for booking enquiries. Web3Forms delivers straight to the
   * address the key was verified against; the access key is public by design
   * (it is embedded in the page and can only ever deliver to that one address),
   * so it is not a secret and belongs in the repo.
   *
   * Empty key = disabled: the forms fall back to WhatsApp only, exactly as
   * before, and nothing on the page changes. Paste the key to switch capture on.
   */
  formEndpoint: 'https://api.web3forms.com/submit',
  formAccessKey: 'fff3ccfe-6c40-4d3c-bf75-fffac0824f60',
} as const;

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
    ],
  },
] as const;
