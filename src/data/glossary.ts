/**
 * Furniture inspection glossary (2026-09 audit, SEO-05).
 *
 * These terms are used across the service, cluster, defect and market pages
 * without ever being defined in one place — a buyer reading "AQL 2.5 major /
 * 4.0 minor under ISO 2859-1, GII" on the PSI page has nowhere to go. Every
 * definition below is assembled from wording already published on the site:
 * the C-01→C-10, V-01→V-10, L-01→L-12 and A-01→A-08 scope tables, the
 * standards list, the cluster risk cards, the Defect Library and the Charter.
 * Nothing here introduces a new claim.
 *
 * One page with anchors rather than 25 thin pages: these are definitions a
 * reader scans, not destinations they land on individually.
 */
export interface GlossaryTerm {
  term: string;
  slug: string;
  /** Shown after the term, e.g. "Acceptable Quality Limit". */
  expansion?: string;
  group: string;
  definition: string;
  /** Where the term does real work on the site. */
  seeAlso?: { label: string; href: string }[];
}

export const GLOSSARY_GROUPS = [
  'Sampling and standards',
  'Wood and moisture',
  'Construction and defects',
  'Loading and packaging',
  'Suppliers and compliance',
] as const;

export const GLOSSARY: GlossaryTerm[] = [
  // ---- Sampling and standards
  {
    term: 'AQL', expansion: 'Acceptable Quality Limit', slug: 'aql', group: 'Sampling and standards',
    definition:
      'The acceptance limit a production lot is judged against. Qualis inspects to AQL 2.5 for major defects and 4.0 for minor defects by default; critical defects are zero-tolerance. The sample size and its accept and reject numbers come from ISO 2859-1, sized to your order quantity — so a larger order is not inspected piece by piece, it is sampled to a plan that carries a known statistical confidence.',
    seeAlso: [{ label: 'What a pre-shipment inspection checks', href: '/pre-shipment-inspection-india/' },
              { label: 'AQL for furniture orders, explained', href: '/blog/aql-furniture-inspection-explained/' }],
  },
  {
    term: 'ISO 2859-1', slug: 'iso-2859-1', group: 'Sampling and standards',
    definition:
      'The international sampling standard that turns an order quantity and an AQL into a sample size and an accept/reject number. It is what makes an inspection result defensible: the number of pieces drawn was not a judgement call, and neither was the pass or fail.',
    seeAlso: [{ label: 'Standards we inspect against', href: '/pre-shipment-inspection-india/' }],
  },
  {
    term: 'General Inspection Level II', expansion: 'GII', slug: 'general-inspection-level-ii', group: 'Sampling and standards',
    definition:
      'The default inspection level under ISO 2859-1, and the one Qualis uses unless a buyer specifies otherwise. It sets how large the sample is relative to the lot. Retail chains often mandate their own level, which we adopt.',
    seeAlso: [{ label: 'Pre-shipment inspection FAQ', href: '/pre-shipment-inspection-india/' }],
  },
  {
    term: 'Critical, major and minor defects', slug: 'defect-severity', group: 'Sampling and standards',
    definition:
      'The three severity classes applied to every finding on a Qualis report. Critical defects are zero-tolerance and fail the lot on their own. Major and minor defects are counted against the AQL plan. Classifying rather than merely listing a defect is what lets you apply your own tolerance instead of ours.',
    seeAlso: [{ label: 'The India Furniture Defect Library', href: '/defects/' }],
  },
  {
    term: 'Golden sample', slug: 'golden-sample', group: 'Sampling and standards',
    definition:
      'The physical reference piece a production run is judged against, agreed and frozen before production starts. Finish, colour and workmanship are compared to it side by side under a daylight lamp and any batch drift is recorded. Hand-applied finishes without a golden sample are effectively unarbitratable: acceptable variation ends up defined by your customers rather than your contract.',
    seeAlso: [{ label: 'Check C-05, finish vs golden sample', href: '/pre-shipment-inspection-india/' },
              { label: 'Finish bloom in transit', href: '/defects/finish-bloom-in-transit/' }],
  },
  {
    term: 'EN 1728, EN 12520 and EN 12521', slug: 'en-furniture-standards', group: 'Sampling and standards',
    definition:
      'European strength and durability standards referenced during structural checks: EN 1728 and EN 12520 for seating, EN 12521 for tables. Racking, load and wobble tests on sampled pieces are referenced to them, which matters because your retail customer very likely tests to the same numbers.',
    seeAlso: [{ label: 'Check C-04, structural and joint integrity', href: '/pre-shipment-inspection-india/' },
              { label: 'Joint and frame failure', href: '/defects/joint-and-frame-failure/' }],
  },
  {
    term: 'ISTA 3A', slug: 'ista-3a', group: 'Loading and packaging',
    definition:
      'A packaged-product transit test for parcel-shipped and flat-pack furniture, run as drop tests across six orientations on sampled cartons. It answers a question a product inspection cannot: whether the packaging survives the journey, not just whether the furniture left correct.',
    seeAlso: [{ label: 'Packaging and transit validation', href: '/packaging-transit-validation/' },
              { label: 'Container loading damage', href: '/defects/container-loading-damage/' }],
  },

  // ---- Wood and moisture
  {
    term: 'Moisture content', expansion: 'MC', slug: 'moisture-content', group: 'Wood and moisture',
    definition:
      'The water held in timber, measured with a pin meter and reported as a range across sampled pieces rather than a single figure. Readings are taken at the core of components, not the surface. The limit belongs to the destination climate, not the factory: our published shipping specifications run 6–8% for Canada, 7–9% for the USA, 8–10% for the UK, Germany and the UAE, and 9–11% for the Netherlands and Australia.',
    seeAlso: [{ label: 'Check C-02, moisture content', href: '/pre-shipment-inspection-india/' },
              { label: 'Moisture content, explained', href: '/blog/moisture-content-indian-solid-wood-furniture/' },
              { label: 'Unseasoned timber cracking', href: '/defects/unseasoned-timber-cracking/' }],
  },
  {
    term: 'Kiln drying', slug: 'kiln-drying', group: 'Wood and moisture',
    definition:
      'Controlled drying of timber to bring it down to a specified moisture content before machining. It is also the first thing cut when an order is running late for a vessel date — and a skipped cycle leaves wood that reads dry on the surface while the core stays wet, which is the single largest claim category we log.',
    seeAlso: [{ label: 'Jodhpur risk guide', href: '/clusters/jodhpur/' },
              { label: 'Audit A-03, material control and kiln records', href: '/factory-audit-india/' }],
  },
  {
    term: 'Bloom and blush', slug: 'bloom-and-blush', group: 'Wood and moisture',
    definition:
      'A milky haze that appears across a lacquered surface when the finish was cured in humid air and then sealed into a hot container. The piece can leave the factory looking correct and arrive unsellable, which is why cure time and a desiccant plan belong in the order rather than the conversation.',
    seeAlso: [{ label: 'Finish bloom in transit', href: '/defects/finish-bloom-in-transit/' },
              { label: 'Monsoon Watch', href: '/monsoon-watch/' }],
  },

  // ---- Construction and defects
  {
    term: 'Mortise and tenon', slug: 'mortise-and-tenon', group: 'Construction and defects',
    definition:
      'The traditional joint used in furniture frames: a projecting tenon cut on one member fits a mortise cut into another. Tenons cut undersized run through the machine faster and still fit, which is why joint integrity is checked physically rather than visually — the failure is invisible until somebody puts their weight on it.',
    seeAlso: [{ label: 'Joint and frame failure', href: '/defects/joint-and-frame-failure/' }],
  },
  {
    term: 'Corner block', slug: 'corner-block', group: 'Construction and defects',
    definition:
      'A reinforcing block fitted inside a frame corner to resist racking. It is the cheapest part of a chair and the easiest to leave out, and its absence cannot be seen in a supplier photograph or in a finished, upholstered piece.',
    seeAlso: [{ label: 'Joint and frame failure', href: '/defects/joint-and-frame-failure/' }],
  },
  {
    term: 'Racking', slug: 'racking', group: 'Construction and defects',
    definition:
      'Sideways deformation of a frame under load — the movement you feel when a chair wobbles diagonally. Racking tests referencing EN 1728 are part of the structural check on sampled pieces.',
    seeAlso: [{ label: 'Check C-04, structural and joint integrity', href: '/pre-shipment-inspection-india/' }],
  },

  // ---- Loading and packaging
  {
    term: 'Dunnage', slug: 'dunnage', group: 'Loading and packaging',
    definition:
      'The airbags, corner boards, lashing and blocking used to stop a load moving inside a container. It is specified in the loading instructions and photographed in place at stuffing, because a stack that stands still in a yard does not stand still at sea.',
    seeAlso: [{ label: 'Loading check L-08, dunnage and bracing', href: '/container-loading-supervision/' },
              { label: 'Container loading damage', href: '/defects/container-loading-damage/' }],
  },
  {
    term: 'Desiccant', slug: 'desiccant', group: 'Loading and packaging',
    definition:
      'Moisture-absorbing material placed in a container to control humidity during the sea leg. Count and position are checked against the specification at loading. It is non-negotiable for natural fibre and for any monsoon-window shipment.',
    seeAlso: [{ label: 'Loading check L-09, desiccant placement', href: '/container-loading-supervision/' },
              { label: 'Kolkata cluster', href: '/clusters/kolkata/' }],
  },
  {
    term: 'Seal verification', slug: 'seal-verification', group: 'Loading and packaging',
    definition:
      'The seal is applied to the closed container in the inspector’s presence and the number photographed close up. It is the link between the goods that were counted in and the goods that arrive — without it, a tally is a claim rather than a record.',
    seeAlso: [{ label: 'Loading check L-12, seal application', href: '/container-loading-supervision/' }],
  },
  {
    term: 'Tally', slug: 'tally', group: 'Loading and packaging',
    definition:
      'The running count of cartons as they load, taken at SKU level and reconciled to your invoice and purchase order rather than only to the supplier’s packing list. On a consolidated container the tally that matters is per factory, not per container.',
    seeAlso: [{ label: 'Loading check L-05, carton tally', href: '/container-loading-supervision/' },
              { label: 'Short shipment', href: '/defects/short-shipment/' }],
  },
  {
    term: 'ISPM 15', slug: 'ispm-15', group: 'Loading and packaging',
    definition:
      'The international standard for solid wood packaging over 6mm — pallets, crates, dunnage, packing blocks, cases and skids. It must be debarked and heat treated or fumigated by a certified provider and carry the IPPC mark. Manufactured board packaging such as plywood, particleboard and OSB is exempt.',
    seeAlso: [{ label: 'Importing furniture to Australia', href: '/importing-furniture-from-india/australia/' }],
  },

  // ---- Suppliers and compliance
  {
    term: 'Manufacturer versus trader', slug: 'manufacturer-versus-trader', group: 'Suppliers and compliance',
    definition:
      'The central question of supplier verification: whether the business you are buying from owns a factory or is an intermediary placing your order elsewhere. It is answered on site by checking machinery consistent with the product, raw material stock and work in progress — not by documents, which a trading office can hold perfectly.',
    seeAlso: [{ label: 'Verification scope V-05', href: '/supplier-verification-india/' },
              { label: 'Delhi NCR cluster', href: '/clusters/delhi-ncr/' }],
  },
  {
    term: 'Red-Flag Check', slug: 'red-flag-check', group: 'Suppliers and compliance',
    definition:
      'A free five-point desk check on a supplier name or marketplace listing, returned within 24 hours. It is deliberately not a verification: it catches the obvious problems before you spend anything, and says plainly when only an on-site visit can answer the question.',
    seeAlso: [{ label: 'Supplier verification', href: '/supplier-verification-india/' }],
  },
  {
    term: 'Subcontracting exposure', slug: 'subcontracting-exposure', group: 'Suppliers and compliance',
    definition:
      'Which processes leave your supplier’s building — carving, turning, finishing, upholstery — and who performs them. Quality control ends at the factory gate unless somebody has mapped where the work actually happens, which is why it is a named line in both verification and the factory audit.',
    seeAlso: [{ label: 'Verification scope V-07', href: '/supplier-verification-india/' },
              { label: 'Audit section A-06', href: '/factory-audit-india/' }],
  },
  {
    term: 'Operator', slug: 'operator', group: 'Suppliers and compliance',
    definition:
      'Under the EU Deforestation Regulation, the party that first places a product on the EU market — for furniture made in India and sold in the EU, that is the importer, not the Indian factory and not the freight forwarder. The operator carries the legal duty and files the due diligence statement; it cannot be delegated to a supplier or to an inspection company.',
    seeAlso: [{ label: 'EUDR compliance for Indian furniture', href: '/eudr-compliance-india-furniture/' }],
  },
  {
    term: 'Independence Charter', slug: 'independence-charter', group: 'Suppliers and compliance',
    definition:
      'The seven clauses that govern every Qualis engagement. Clause 01: all revenue comes from buyer-paid fees, with no commission, referral fee, gift or hospitality from any factory, trader or exporter. Clause 02: the fee is fixed at booking and does not change with the result. An inspector paid by the party being inspected has no reason to fail anything.',
    seeAlso: [{ label: 'The Independence Charter', href: '/why-independent/' }],
  },
  {
    term: 'Pre-shipment inspection', expansion: 'PSI', slug: 'pre-shipment-inspection', group: 'Suppliers and compliance',
    definition:
      'An independent check of a finished order at the factory, once production is complete and the goods are packed, but before the balance payment is released. Cartons are drawn at random, measured against your specification, and reported with photographed findings and a pass or fail result.',
    seeAlso: [{ label: 'Pre-shipment inspection', href: '/pre-shipment-inspection-india/' }],
  },
  {
    term: 'During-production inspection', expansion: 'DUPRO', slug: 'during-production-inspection', group: 'Suppliers and compliance',
    definition:
      'An inspection run at roughly 20–50% complete, while rework is still cheap and the vessel date is still safe. It is the only point at which components can be checked before assembly and finishing hide them — which is why substitution and joint problems are caught here or not at all.',
    seeAlso: [{ label: 'During-production inspection', href: '/during-production-inspection/' }],
  },
  {
    term: 'Container loading supervision', expansion: 'CLS', slug: 'container-loading-supervision', group: 'Loading and packaging',
    definition:
      'An on-site check at the moment of stuffing. The empty container is inspected before anything goes in, every carton is counted against your invoice as it loads, condition and stacking are photographed tier by tier, and the seal number is recorded on the closed doors. A passed inspection does not cover it: the two happen days apart and protect against different failures.',
    seeAlso: [{ label: 'Container loading supervision', href: '/container-loading-supervision/' },
              { label: 'PSI or CLS? What each one catches', href: '/blog/pre-shipment-inspection-vs-container-loading-supervision/' }],
  },
];
