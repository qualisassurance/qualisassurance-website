/**
 * Cross-family related links (2026-09 audit, IA-02).
 *
 * Measured before writing this: of the ten service pages, eight linked to no
 * cluster, nine to no market guide, and none to a defect entry or a Field Note.
 * The six /buyers/ pages linked only to services and to each other. Those are
 * the site's highest-intent pages and they were lateral dead ends.
 *
 * The relationships are hand-written rather than generated. An arbitrary
 * "related" block is worse than none: it dilutes the signal and reads as
 * filler. Each entry below is a link a reader on that page would actually
 * follow — the cluster where that service is most booked, the defect it
 * catches, the destination whose rules drive it.
 */
export interface RelatedSet {
  /** Optional one-line framing above the links. */
  lede?: string;
  services?: string[];
  clusters?: string[];
  guides?: string[];
  defects?: string[];
  posts?: string[];
  pages?: string[];
}

/** Human labels for every route this map can point at. */
export const LABELS: Record<string, string> = {
  '/pre-shipment-inspection-india/': 'Pre-shipment inspection',
  '/supplier-verification-india/': 'Supplier verification',
  '/factory-audit-india/': 'Factory audit',
  '/container-loading-supervision/': 'Container loading supervision',
  '/during-production-inspection/': 'During-production inspection',
  '/production-monitoring-india/': 'Production monitoring',
  '/packaging-transit-validation/': 'Packaging & transit validation',
  '/supplier-shortlisting/': 'Supplier shortlisting',
  '/monsoon-watch/': 'Monsoon Watch',
  '/first-order-shield/': 'First Order Shield',

  '/clusters/jodhpur/': 'Jodhpur',
  '/clusters/jaipur/': 'Jaipur',
  '/clusters/saharanpur/': 'Saharanpur',
  '/clusters/moradabad/': 'Moradabad',
  '/clusters/delhi-ncr/': 'Delhi NCR',
  '/clusters/kolkata/': 'Kolkata',
  '/clusters/': 'All six clusters',

  '/importing-furniture-from-india/usa/': 'Importing to the USA',
  '/importing-furniture-from-india/uk/': 'Importing to the UK',
  '/importing-furniture-from-india/germany/': 'Importing to Germany',
  '/importing-furniture-from-india/netherlands/': 'Importing to the Netherlands',
  '/importing-furniture-from-india/australia/': 'Importing to Australia',
  '/importing-furniture-from-india/canada/': 'Importing to Canada',
  '/importing-furniture-from-india/france/': 'Importing to France',
  '/importing-furniture-from-india/uae/': 'Importing to the UAE & GCC',
  '/importing-furniture-from-india/saudi-arabia/': 'Importing to Saudi Arabia',
  '/importing-furniture-from-india/': 'All ten market guides',
  '/eudr-compliance-india-furniture/': 'EUDR compliance',
  '/eudr-supplier-evidence-review/': 'EUDR evidence review',

  '/defects/unseasoned-timber-cracking/': 'Unseasoned timber cracking',
  '/defects/finish-bloom-in-transit/': 'Finish bloom in transit',
  '/defects/joint-and-frame-failure/': 'Joint and frame failure',
  '/defects/short-shipment/': 'Short shipment',
  '/defects/wrong-or-missing-hardware/': 'Wrong or missing hardware',
  '/defects/container-loading-damage/': 'Container loading damage',
  '/defects/': 'The Defect Library',

  '/blog/aql-furniture-inspection-explained/': 'AQL for furniture orders, explained',
  '/blog/moisture-content-indian-solid-wood-furniture/': 'Moisture content, measured not assumed',
  '/blog/solid-wood-dining-table-top-cracking/': 'Why solid wood table tops crack',
  '/blog/pre-shipment-inspection-vs-container-loading-supervision/': 'PSI or CLS? What each one catches',
  '/blog/first-furniture-order-jodhpur-checklist/': 'Your first order from Jodhpur: a checklist',

  '/why-independent/': 'The Independence Charter',
  '/sample-reports/': 'What a report contains',
  '/pricing/': 'Published pricing',
  '/glossary/': 'Glossary',
  '/buyers/': 'Who we protect',
  '/import-compliance/': 'Compliance map',
};

export const RELATED: Record<string, RelatedSet> = {
  // ---------- Services
  '/pre-shipment-inspection-india/': {
    lede: 'Where a pre-shipment inspection sits in the rest of the picture.',
    services: ['/during-production-inspection/', '/container-loading-supervision/'],
    clusters: ['/clusters/jodhpur/', '/clusters/jaipur/'],
    guides: ['/importing-furniture-from-india/usa/', '/importing-furniture-from-india/uk/'],
    defects: ['/defects/unseasoned-timber-cracking/', '/defects/joint-and-frame-failure/'],
    posts: ['/blog/aql-furniture-inspection-explained/'],
  },
  '/container-loading-supervision/': {
    lede: 'The last hundred metres, and what happens either side of it.',
    services: ['/pre-shipment-inspection-india/', '/packaging-transit-validation/'],
    clusters: ['/clusters/jodhpur/', '/clusters/delhi-ncr/'],
    guides: ['/importing-furniture-from-india/australia/'],
    defects: ['/defects/container-loading-damage/', '/defects/short-shipment/'],
    posts: ['/blog/pre-shipment-inspection-vs-container-loading-supervision/'],
  },
  '/supplier-verification-india/': {
    lede: 'Establishing who you are buying from, and what comes after.',
    services: ['/factory-audit-india/', '/supplier-shortlisting/'],
    clusters: ['/clusters/delhi-ncr/', '/clusters/jodhpur/'],
    guides: ['/eudr-supplier-evidence-review/'],
    defects: ['/defects/joint-and-frame-failure/'],
    posts: ['/blog/first-furniture-order-jodhpur-checklist/'],
  },
  '/factory-audit-india/': {
    lede: 'What an audit establishes, and where the findings get used.',
    services: ['/supplier-verification-india/', '/production-monitoring-india/'],
    clusters: ['/clusters/delhi-ncr/', '/clusters/jodhpur/'],
    guides: ['/eudr-compliance-india-furniture/'],
    defects: ['/defects/unseasoned-timber-cracking/'],
  },
  '/during-production-inspection/': {
    lede: 'The visit that happens while problems are still cheap to fix.',
    services: ['/pre-shipment-inspection-india/', '/production-monitoring-india/'],
    clusters: ['/clusters/jodhpur/', '/clusters/delhi-ncr/'],
    defects: ['/defects/unseasoned-timber-cracking/', '/defects/joint-and-frame-failure/'],
    posts: ['/blog/moisture-content-indian-solid-wood-furniture/'],
  },
  '/production-monitoring-india/': {
    lede: 'Eyes on a long run, and the checks that bookend it.',
    services: ['/during-production-inspection/', '/pre-shipment-inspection-india/'],
    clusters: ['/clusters/jodhpur/', '/clusters/saharanpur/'],
    defects: ['/defects/unseasoned-timber-cracking/'],
    posts: ['/blog/first-furniture-order-jodhpur-checklist/'],
  },
  '/packaging-transit-validation/': {
    lede: 'Testing the journey, not just the product.',
    services: ['/container-loading-supervision/', '/pre-shipment-inspection-india/'],
    clusters: ['/clusters/kolkata/', '/clusters/jodhpur/'],
    guides: ['/importing-furniture-from-india/usa/'],
    defects: ['/defects/container-loading-damage/', '/defects/wrong-or-missing-hardware/'],
  },
  '/supplier-shortlisting/': {
    lede: 'Finding candidates, and proving they are real.',
    services: ['/supplier-verification-india/', '/factory-audit-india/'],
    clusters: ['/clusters/jodhpur/', '/clusters/delhi-ncr/'],
    posts: ['/blog/first-furniture-order-jodhpur-checklist/'],
    pages: ['/why-independent/'],
  },
  '/monsoon-watch/': {
    lede: 'What the season does, and the checks that answer it.',
    services: ['/container-loading-supervision/', '/during-production-inspection/'],
    clusters: ['/clusters/jodhpur/', '/clusters/kolkata/'],
    guides: ['/importing-furniture-from-india/netherlands/'],
    defects: ['/defects/finish-bloom-in-transit/'],
  },
  '/first-order-shield/': {
    lede: 'The three services in the bundle, and the order they run in.',
    services: ['/supplier-verification-india/', '/during-production-inspection/', '/pre-shipment-inspection-india/'],
    clusters: ['/clusters/jodhpur/'],
    posts: ['/blog/first-furniture-order-jodhpur-checklist/'],
    pages: ['/pricing/'],
  },

  // ---------- Buyer pages
  '/buyers/importers/': {
    services: ['/pre-shipment-inspection-india/', '/container-loading-supervision/'],
    clusters: ['/clusters/jodhpur/'],
    guides: ['/importing-furniture-from-india/'],
    defects: ['/defects/short-shipment/'],
    pages: ['/pricing/'],
  },
  '/buyers/retail-chains/': {
    services: ['/factory-audit-india/', '/production-monitoring-india/'],
    clusters: ['/clusters/jodhpur/'],
    guides: ['/importing-furniture-from-india/uk/'],
    defects: ['/defects/joint-and-frame-failure/'],
    posts: ['/blog/aql-furniture-inspection-explained/'],
  },
  '/buyers/brands/': {
    services: ['/during-production-inspection/', '/pre-shipment-inspection-india/'],
    clusters: ['/clusters/jodhpur/', '/clusters/jaipur/'],
    defects: ['/defects/finish-bloom-in-transit/'],
    pages: ['/sample-reports/'],
  },
  '/buyers/ecommerce/': {
    services: ['/packaging-transit-validation/', '/pre-shipment-inspection-india/'],
    clusters: ['/clusters/jodhpur/'],
    guides: ['/importing-furniture-from-india/usa/'],
    defects: ['/defects/wrong-or-missing-hardware/', '/defects/container-loading-damage/'],
  },
  '/buyers/projects/': {
    services: ['/production-monitoring-india/', '/container-loading-supervision/'],
    clusters: ['/clusters/delhi-ncr/', '/clusters/jodhpur/'],
    guides: ['/importing-furniture-from-india/uae/'],
    defects: ['/defects/short-shipment/'],
  },
  '/buyers/procurement/': {
    services: ['/supplier-verification-india/', '/factory-audit-india/'],
    clusters: ['/clusters/delhi-ncr/'],
    guides: ['/import-compliance/'],
    pages: ['/why-independent/', '/pricing/'],
  },

  // ---------- Clusters (they already link services and guides; these add depth)
  '/clusters/jodhpur/': {
    defects: ['/defects/unseasoned-timber-cracking/', '/defects/finish-bloom-in-transit/'],
    posts: ['/blog/first-furniture-order-jodhpur-checklist/', '/blog/moisture-content-indian-solid-wood-furniture/'],
    pages: ['/glossary/'],
  },
  '/clusters/jaipur/': {
    defects: ['/defects/finish-bloom-in-transit/'],
    posts: ['/blog/solid-wood-dining-table-top-cracking/'],
    pages: ['/glossary/'],
  },
  '/clusters/saharanpur/': {
    defects: ['/defects/unseasoned-timber-cracking/'],
    posts: ['/blog/moisture-content-indian-solid-wood-furniture/'],
    pages: ['/glossary/'],
  },
  '/clusters/moradabad/': {
    defects: ['/defects/joint-and-frame-failure/'],
    posts: ['/blog/aql-furniture-inspection-explained/'],
    pages: ['/glossary/'],
  },
  '/clusters/delhi-ncr/': {
    defects: ['/defects/joint-and-frame-failure/', '/defects/short-shipment/'],
    posts: ['/blog/first-furniture-order-jodhpur-checklist/'],
    pages: ['/glossary/'],
  },
  '/clusters/kolkata/': {
    defects: ['/defects/finish-bloom-in-transit/', '/defects/container-loading-damage/'],
    posts: ['/blog/moisture-content-indian-solid-wood-furniture/'],
    pages: ['/glossary/'],
  },
};

/**
 * Blog posts come from WordPress, so a per-post map would go stale the moment
 * somebody publishes. These are keyed to the category slug the CMS already
 * assigns, which is stable, and fall back to nothing for an unknown category
 * rather than guessing.
 */
export const RELATED_BY_CATEGORY: Record<string, RelatedSet> = {
  'inspection-standards': {
    lede: 'The services and references behind this note.',
    services: ['/pre-shipment-inspection-india/', '/container-loading-supervision/'],
    clusters: ['/clusters/jodhpur/'],
    defects: ['/defects/short-shipment/'],
    pages: ['/glossary/', '/sample-reports/'],
  },
  'materials-defects': {
    lede: 'The services and references behind this note.',
    services: ['/during-production-inspection/', '/pre-shipment-inspection-india/'],
    clusters: ['/clusters/jodhpur/', '/clusters/kolkata/'],
    defects: ['/defects/unseasoned-timber-cracking/', '/defects/finish-bloom-in-transit/'],
    pages: ['/glossary/'],
  },
  'sourcing-in-india': {
    lede: 'The services and references behind this note.',
    services: ['/supplier-verification-india/', '/first-order-shield/'],
    clusters: ['/clusters/jodhpur/', '/clusters/delhi-ncr/'],
    guides: ['/importing-furniture-from-india/'],
    pages: ['/why-independent/', '/pricing/'],
  },
};
