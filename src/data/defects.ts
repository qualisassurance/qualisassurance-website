/**
 * The India Furniture Defect Library (2026-09 audit, SEO-02).
 *
 * /defects/ shipped as a 214-word promise — "first 40 entries publishing at
 * launch" — with no entries, while the home page linked to it as "the full
 * India Furniture Defect Library". These six are the six already published as
 * cards on the home page, given the entry shape /defects/ itself specifies:
 * defect ID and family, a macro photograph with measurement annotation,
 * material and process stage, root cause, severity per AQL practice, how to
 * specify against it in a PO, and which service catches it.
 *
 * Every field traces to copy already on the site — the home cards, the
 * C-01→C-10 / L-01→L-12 / V-01→V-10 / A-01→A-08 scope tables, the standards
 * list on the PSI page, the cluster risk cards and the Field Notes posts.
 * Nothing here is a new claim, and no entry is invented to pad the six to
 * forty. Adding an entry means adding an object here.
 */
export type Severity = 'CRITICAL' | 'MAJOR' | 'MINOR';

export interface DefectEntry {
  /** Library reference, as printed on the report and the home card. */
  id: string;
  slug: string;
  family: string;
  severity: Severity;
  title: string;
  /** One-line summary — the home card's blurb. */
  summary: string;
  /** Meta description. Written per entry to stay inside 160 characters. */
  meta: string;
  /** Photograph, and the measurement annotation pinned over it where one exists. */
  image: string;
  imageAlt: string;
  anno?: string;
  material: string;
  stage: string;
  /** Why it happens. */
  cause: string[];
  /** Where the buyer actually meets it. */
  surfaces: string;
  /** How to write it into a purchase order so it becomes enforceable. */
  specify: string[];
  /** Scope codes and services that catch it. `href` is the service page. */
  caughtAt: { code: string; href: string }[];
  /** Further reading already on the site. */
  related: { label: string; href: string }[];
}

export const DEFECTS: DefectEntry[] = [
  {
    id: 'DEF-011',
    slug: 'unseasoned-timber-cracking',
    family: 'Wood · Moisture',
    severity: 'CRITICAL',
    title: 'Unseasoned timber cracking',
    summary:
      'Sheesham shipped above 12% moisture splits when it meets central heating in the US or EU. The single largest claim category.',
    meta:
      'Why sheesham and mango furniture cracks after delivery: skipped kiln cycles, the moisture limit to specify in your PO, and the check that catches it.',
    image: '/images/img-02.jpg',
    imageAlt: 'Hairline crack running along the grain of a sheesham tabletop, with a steel rule beside it for scale.',
    anno: 'SPLIT 0.4MM',
    material: 'Solid hardwood — sheesham, mango, acacia',
    stage: 'Timber seasoning and kiln drying, before machining',
    cause: [
      'Kiln time is the first thing cut when an order is running late for a vessel date. The surface of a board reads dry on a pin meter long before the core does, so a batch can look ready and ship wet.',
      'Wood then gives up that moisture wherever it lands. In a centrally heated home in a British or German winter, or an Arizona warehouse, it shrinks across the grain and the tabletop splits or the joint opens.',
      'Because the failure happens weeks after delivery, it reaches you as a customer return rather than a shipping dispute — which is why it is the largest single claim family we log.',
    ],
    surfaces: 'Six weeks to six months after delivery, in the first heating season.',
    specify: [
      'Put a number in the purchase order, not an adjective. "Properly seasoned" is a hope; "≤10% at pre-shipment inspection, pin meter, core reading" is a specification.',
      'Set the limit against the destination climate, not the factory’s. Our published shipping specifications run 6–8% for Canada, 7–9% for the USA, 8–10% for the UK, Germany and the UAE, and 9–11% for the Netherlands and Australia.',
      'Require the reading as a range across sampled pieces rather than one figure, so a single flattering board cannot represent the batch.',
      'Book a during-production visit as well as a pre-shipment inspection. Once the batch is packed, a moisture failure means unpacking and re-kilning against your vessel date.',
    ],
    caughtAt: [
      { code: 'PSI C-02 · Moisture content', href: '/pre-shipment-inspection-india/' },
      { code: 'During-production inspection', href: '/during-production-inspection/' },
      { code: 'Audit A-03 · Material control, kiln records', href: '/factory-audit-india/' },
    ],
    related: [
      { label: 'Moisture content: the defect that shows up after your container lands', href: '/blog/moisture-content-indian-solid-wood-furniture/' },
      { label: 'Why solid wood dining table tops crack and joints open', href: '/blog/solid-wood-dining-table-top-cracking/' },
      { label: 'Jodhpur risk guide — skipped kiln cycles', href: '/clusters/jodhpur/' },
    ],
  },
  {
    id: 'DEF-024',
    slug: 'finish-bloom-in-transit',
    family: 'Finish · Humidity',
    severity: 'MAJOR',
    title: 'Finish bloom in transit',
    summary: 'Lacquer cured during monsoon humidity clouds and blushes inside a hot container.',
    meta:
      'Why lacquer blooms inside a container: monsoon curing, the cure time and desiccant plan to specify, and the checks that catch it before loading.',
    image: '/images/img-03.jpg',
    imageAlt: 'Cloudy white bloom across a dark lacquered furniture surface, the haze picked out by a window reflection.',
    material: 'Lacquered, polished and sprayed finishes',
    stage: 'Finishing and curing, and then the sea leg',
    cause: [
      'Lacquer needs stable, dry air to cure. Sprayed and stacked during a monsoon week, it traps moisture in the film instead of releasing it.',
      'The piece can leave the factory looking correct. Sealed into a container that runs hot and humid for four to six weeks, the trapped moisture comes out of solution as a milky bloom across the surface.',
      'It is a cosmetic defect that behaves like a structural one commercially: the goods are unsellable at full price and the cause is invisible at the point the shipment was accepted.',
    ],
    surfaces: 'On unpacking at destination, after the container has been at sea.',
    specify: [
      'Agree a minimum cure time between final coat and packing, and make it a condition rather than a preference.',
      'Approve a golden sample for the finish and freeze it, so acceptable variation is defined against a physical reference instead of by your customers’ reviews.',
      'For July to September production, specify a desiccant and moisture plan for the container before it is stuffed.',
      'Avoid a monsoon vessel date for high-gloss and dark lacquered ranges where the schedule allows it.',
    ],
    caughtAt: [
      { code: 'PSI C-05 · Finish vs golden sample', href: '/pre-shipment-inspection-india/' },
      { code: 'CLS L-09 · Desiccant placement', href: '/container-loading-supervision/' },
      { code: 'Monsoon Watch · seasonal advisory', href: '/monsoon-watch/' },
    ],
    related: [
      { label: 'Monsoon Watch — moisture, curing and lead-time risk', href: '/monsoon-watch/' },
      { label: 'Jodhpur risk guide — July to September physics', href: '/clusters/jodhpur/' },
    ],
  },
  {
    id: 'DEF-032',
    slug: 'joint-and-frame-failure',
    family: 'Structure · Joint',
    severity: 'CRITICAL',
    title: 'Joint and frame failure',
    summary:
      'Subcontracted assembly with undersized tenons or missing corner blocks — invisible until a customer sits down.',
    meta:
      'Undersized tenons and missing corner blocks in subcontracted furniture: why joints fail in year one, what to specify, and when to inspect.',
    image: '/images/img-04.jpg',
    imageAlt: 'Underside of a chair on a workbench showing an open mortise-and-tenon joint with a visible gap.',
    anno: 'GAP 2MM',
    material: 'Chairs, sofa frames, table bases — any load-bearing joinery',
    stage: 'Joinery and assembly, frequently subcontracted',
    cause: [
      'Tenons cut undersized run through the machine faster and still fit the mortise. Corner blocks are the cheapest part of a chair and the easiest to leave out.',
      'Assembly is one of the processes most often sent outside the main factory, so the joinery in your order may never have been made by the supplier you audited.',
      'Nothing about it is visible once the piece is finished and packed. The failure arrives when a customer puts their weight on it.',
    ],
    surfaces: 'In the first year of domestic use, as a warranty return or a retailer chargeback.',
    specify: [
      'Name the joint. Specify the construction — mortise and tenon, dowel, corner block, bracket — for each load-bearing junction rather than leaving it to the factory.',
      'Reference a standard your retailer already tests to: EN 1728 and EN 12520 for seating, EN 12521 for tables.',
      'Require a during-production visit before upholstery or finishing closes the frame, because after that the joint cannot be inspected without destroying the piece.',
      'Ask where assembly actually happens, and get that address into the purchase order.',
    ],
    caughtAt: [
      { code: 'PSI C-04 · Structural and joint integrity, EN 1728 racking', href: '/pre-shipment-inspection-india/' },
      { code: 'During-production inspection, before the frame closes', href: '/during-production-inspection/' },
      { code: 'Verification V-07 · Subcontracting exposure', href: '/supplier-verification-india/' },
    ],
    related: [
      { label: 'Delhi NCR risk guide — upholstery leaves the building', href: '/clusters/delhi-ncr/' },
      { label: 'What a pre-shipment inspection actually checks', href: '/pre-shipment-inspection-india/' },
    ],
  },
  {
    id: 'DEF-047',
    slug: 'short-shipment',
    family: 'Quantity · Count',
    severity: 'MAJOR',
    title: 'Short shipment',
    summary:
      'Cartons counted at the door, not the invoice. Orders arrive 5–20% short with no recourse after payment.',
    meta:
      'Why furniture orders arrive short: cartons counted against the packing list, not your invoice. What to specify, and where the tally happens.',
    image: '/images/img-05.jpg',
    imageAlt: 'Warehouse stack of brown export cartons being tally-counted, with the count chalked on the end panels.',
    material: 'Any packed goods',
    stage: 'Packing, tally and container stuffing',
    cause: [
      'The count is taken against the supplier’s own packing list rather than against your invoice, so a document that agrees with itself passes.',
      'On consolidated containers built by an export house from several factories, a per-container count tells you the box is full — not that everything in it is yours.',
      'Discovered at destination, it is a credit-note negotiation with a supplier who already holds your balance payment. Found in India, it is a loading correction.',
    ],
    surfaces: 'At devanning, once the balance has been paid.',
    specify: [
      'Require the tally to be reconciled to your commercial invoice and purchase order, not only to the packing list.',
      'Require an SKU-level count rather than a carton count, so a full container of the wrong mix cannot pass.',
      'On any consolidated load, require a per-factory tally at the door.',
      'Tie the balance payment to a passed inspection report, so the count happens while the leverage is still yours.',
    ],
    caughtAt: [
      { code: 'PSI C-01 · Quantity verification vs PO and packing list', href: '/pre-shipment-inspection-india/' },
      { code: 'CLS L-05 · Carton tally vs packing list', href: '/container-loading-supervision/' },
      { code: 'CLS L-11 · Load plan as executed', href: '/container-loading-supervision/' },
    ],
    related: [
      { label: 'Pre-shipment inspection or container loading supervision?', href: '/blog/pre-shipment-inspection-vs-container-loading-supervision/' },
      { label: 'Delhi NCR risk guide — one container, several factories', href: '/clusters/delhi-ncr/' },
    ],
  },
  {
    id: 'DEF-053',
    slug: 'wrong-or-missing-hardware',
    family: 'Hardware · Kit',
    severity: 'MAJOR',
    title: 'Wrong or missing hardware',
    summary: 'Flat-pack kits with mismatched fittings turn a sellable SKU into a returns problem.',
    meta:
      'Missing and mismatched fittings in flat-pack furniture kits: why kitting fails, the hardware BOM to specify, and the kit-by-kit check.',
    image: '/images/img-06.jpg',
    imageAlt: 'Flat-pack hardware bag emptied onto a white tray, bolts sorted into rows with one row visibly short.',
    anno: 'M6 ×4 MISSING',
    material: 'Flat-pack and knock-down furniture',
    stage: 'Kitting and packing',
    cause: [
      'Hardware is bagged in a separate operation from the furniture it belongs to, often by a different team on a different day, and a bag that is four bolts short weighs almost the same as a correct one.',
      'A range with several similar SKUs invites the wrong kit into the right carton. Nothing in the packing process catches it, because the carton count is right.',
      'For an e-commerce seller this is a total loss on the unit: the customer cannot assemble it, and the return costs more than the margin.',
    ],
    surfaces: 'In the customer’s living room, as a one-star review and a return.',
    specify: [
      'Supply a hardware bill of materials per SKU and require the kit to be checked against it, not against a generic list.',
      'Require a printed kit list inside every carton, in the destination language where the market needs one.',
      'Ask for kit-by-kit checks on sampled flat-packs rather than one kit per production run.',
      'Include the assembly instructions in the same check — a correct kit with the wrong instruction sheet fails the same way.',
    ],
    caughtAt: [
      { code: 'PSI C-07 · Hardware kits and assembly guides vs BOM', href: '/pre-shipment-inspection-india/' },
      { code: 'PSI C-08 · Function and moving parts, cycle tested', href: '/pre-shipment-inspection-india/' },
    ],
    related: [
      { label: 'Packaging and transit validation for e-commerce furniture', href: '/packaging-transit-validation/' },
      { label: 'For e-commerce sellers', href: '/buyers/ecommerce/' },
    ],
  },
  {
    id: 'DEF-061',
    slug: 'container-loading-damage',
    family: 'Loading · Stacking',
    severity: 'CRITICAL',
    title: 'Container loading damage',
    summary: 'Poor dunnage and stacking crush the bottom tier before the ship leaves Mundra.',
    meta:
      'Crushed bottom tiers and shifted loads: how poor dunnage and stacking damage furniture after inspection, and the loading checks that prevent it.',
    image: '/images/img-07.jpg',
    imageAlt: 'Inside an open 40ft container: a crushed bottom-tier carton under a badly stacked load, lit by an inspector’s torch.',
    material: 'Any cartoned furniture, worst on flat-pack and light cartons',
    stage: 'Container stuffing, at the factory ramp or the inland container depot',
    cause: [
      'Loading is paid by the container, not by the care taken, so heavy cartons go on top of light ones and void columns are left unbraced.',
      'A stack that stands still in a yard does not stand still at sea. Weeks of vibration and roll compress the bottom tier, and unbraced voids let the load shift into itself.',
      'The damage is sealed inside the box. It is created after the goods passed inspection, which is exactly why a passed pre-shipment inspection does not cover it.',
    ],
    surfaces: 'At devanning, on the tier nobody could see once the doors were shut.',
    specify: [
      'Specify the stacking rule — heavy below light, maximum tier count for the carton spec — and put it in the loading instructions.',
      'Specify dunnage: airbags, corner boards and lashing where the load needs them, and require them photographed in place.',
      'Require a door-to-back photo sequence of the load as executed, and the seal number photographed close up.',
      'Book loading supervision as well as inspection. They are days apart and protect against completely different failures.',
    ],
    caughtAt: [
      { code: 'CLS L-07 · Stacking and weight distribution', href: '/container-loading-supervision/' },
      { code: 'CLS L-08 · Dunnage and bracing, photographed in place', href: '/container-loading-supervision/' },
      { code: 'ISTA 3A drop testing on the carton spec', href: '/packaging-transit-validation/' },
    ],
    related: [
      { label: 'Pre-shipment inspection or container loading supervision?', href: '/blog/pre-shipment-inspection-vs-container-loading-supervision/' },
      { label: 'Container loading supervision, L-01 to L-12', href: '/container-loading-supervision/' },
    ],
  },
];

export const defectBySlug = (slug: string): DefectEntry | undefined =>
  DEFECTS.find((d) => d.slug === slug);
