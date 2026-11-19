/**
 * Single source for the sample catalog.
 * Writes src/data/catalog.json, supabase/seed.sql, and the seed migration.
 *
 * Prices are invented sample numbers for the demo. They are not live quotes.
 * Run with: npm run catalog
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SAMPLE_NOTE =
  "Sample price for this demo. Not a live retail quote.";

function hash(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function historyFor(offerId, seedPriceCents) {
  const days = ["2026-10-21", "2026-10-28", "2026-11-04", "2026-11-11", "2026-11-18"];
  return days.map((day, index) => {
    const wobble = ((hash(`${offerId}:${index}`) % 7) - 3) / 100;
    const priceCents =
      index === days.length - 1
        ? seedPriceCents
        : Math.max(1, Math.round(seedPriceCents * (1 + wobble)));
    return { priceCents, recordedAt: `${day}T15:00:00.000Z` };
  });
}

function searchUrl(retailer, name) {
  const q = encodeURIComponent(name);
  switch (retailer) {
    case "amazon":
      return `https://www.amazon.com/s?k=${q}`;
    case "bestbuy":
      return `https://www.bestbuy.com/site/searchpage.jsp?st=${q}`;
    case "walmart":
      return `https://www.walmart.com/search?q=${q}`;
    case "target":
      return `https://www.target.com/s?searchTerm=${q}`;
    default: {
      throw new Error(`Unknown retailer ${retailer}`);
    }
  }
}

function offers(slug, name, rows) {
  return rows.map((row) => {
    const id = `${slug}-${row.retailer}`;
    const history = historyFor(id, row.priceCents);
    return {
      id,
      productSlug: slug,
      retailer: row.retailer,
      program: row.program,
      priceCents: row.priceCents,
      seedPriceCents: row.priceCents,
      currency: "USD",
      url: searchUrl(row.retailer, name),
      inStock: row.inStock !== false,
      externalSku: `sample-${id}`,
      lastCheckedAt: history[history.length - 1].recordedAt,
      history,
    };
  });
}

function product(input) {
  return {
    slug: input.slug,
    name: input.name,
    brand: input.brand,
    category: input.category,
    platforms: input.platforms,
    bias: input.bias,
    quality: input.quality,
    summary: input.summary,
    specs: input.specs,
    sampleNote: SAMPLE_NOTE,
    offers: offers(input.slug, input.name, input.offers),
  };
}

const products = [
  product({
    slug: "sony-ps5-slim-digital",
    name: "PlayStation 5 Slim Digital Edition",
    brand: "Sony",
    category: "console",
    platforms: ["ps5"],
    bias: "competitive",
    quality: 82,
    summary:
      "Disc-free PS5 Slim. Leaves more of a tight budget for a screen or headset. GTA 6 is a digital purchase on this model.",
    specs: [
      { label: "Storage", value: "1 TB SSD" },
      { label: "Disc drive", value: "None" },
      { label: "Output", value: "Up to 4K" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 44900 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 44900 },
      { retailer: "walmart", program: "walmart", priceCents: 45900 },
    ],
  }),
  product({
    slug: "sony-ps5-slim-disc",
    name: "PlayStation 5 Slim Disc Edition",
    brand: "Sony",
    category: "console",
    platforms: ["ps5"],
    bias: "cinematic",
    quality: 88,
    summary:
      "PS5 Slim with a 4K Blu-ray drive. The sample catalog treats this as the cinematic PS5 because it also plays discs.",
    specs: [
      { label: "Storage", value: "1 TB SSD" },
      { label: "Disc drive", value: "4K UHD Blu-ray" },
      { label: "Output", value: "Up to 4K" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 49900 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 49900 },
      { retailer: "target", program: "target", priceCents: 49900 },
    ],
  }),
  product({
    slug: "xbox-series-x",
    name: "Xbox Series X",
    brand: "Microsoft",
    category: "console",
    platforms: ["xbox"],
    bias: "cinematic",
    quality: 90,
    summary:
      "Flagship Xbox in this sample catalog. 4K target and a disc drive. The right Series console when the screen budget can survive a $499 box.",
    specs: [
      { label: "Storage", value: "1 TB SSD" },
      { label: "Disc drive", value: "4K UHD Blu-ray" },
      { label: "Output", value: "Up to 4K" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 49900 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 49900 },
      { retailer: "walmart", program: "walmart", priceCents: 51900 },
    ],
  }),
  product({
    slug: "xbox-series-s",
    name: "Xbox Series S",
    brand: "Microsoft",
    category: "console",
    platforms: ["xbox"],
    bias: "competitive",
    quality: 70,
    summary:
      "Smallest Xbox that runs the Series generation. Digital only, and the storage is tight for a game the size of GTA 6, so pair it with the expansion card if you can.",
    specs: [
      { label: "Storage", value: "512 GB SSD" },
      { label: "Disc drive", value: "None" },
      { label: "Output", value: "Up to 1440p target" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 34900 },
      { retailer: "walmart", program: "walmart", priceCents: 32900 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 34900 },
    ],
  }),
  product({
    slug: "lg-c4-42",
    name: "LG C4 42-inch OLED TV",
    brand: "LG",
    category: "display",
    platforms: ["ps5", "xbox", "pc"],
    bias: "cinematic",
    quality: 96,
    summary:
      "42-inch OLED. The sample catalog's premium cinematic screen: high contrast for night driving, and still small enough for a desk.",
    specs: [
      { label: "Size", value: "42 inch" },
      { label: "Panel", value: "OLED" },
      { label: "Refresh", value: "120 Hz" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 99600 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 104900 },
      { retailer: "walmart", program: "walmart", priceCents: 97900 },
    ],
  }),
  product({
    slug: "tcl-qm7-55",
    name: "TCL QM7 55-inch TV",
    brand: "TCL",
    category: "display",
    platforms: ["ps5", "xbox", "pc"],
    bias: "cinematic",
    quality: 84,
    summary:
      "55-inch mini-LED in the sample catalog. The mid cinematic pick when an OLED does not fit the screen allocation.",
    specs: [
      { label: "Size", value: "55 inch" },
      { label: "Panel", value: "Mini-LED" },
      { label: "Refresh", value: "120 Hz" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 54800 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 57900 },
      { retailer: "walmart", program: "walmart", priceCents: 52900 },
    ],
  }),
  product({
    slug: "sony-bravia-x90l-55",
    name: "Sony Bravia X90L 55-inch TV",
    brand: "Sony",
    category: "display",
    platforms: ["ps5", "xbox", "pc"],
    bias: "cinematic",
    quality: 80,
    summary:
      "55-inch full-array LED. A cinematic living-room panel in the sample catalog, priced between the TCL and the OLED.",
    specs: [
      { label: "Size", value: "55 inch" },
      { label: "Panel", value: "Full-array LED" },
      { label: "Refresh", value: "120 Hz" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 69800 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 74800 },
      { retailer: "target", program: "target", priceCents: 67900 },
    ],
  }),
  product({
    slug: "samsung-odyssey-g6-27",
    name: "Samsung Odyssey G6 27-inch",
    brand: "Samsung",
    category: "display",
    platforms: ["ps5", "xbox", "pc"],
    bias: "competitive",
    quality: 88,
    summary:
      "27-inch 240 Hz QHD monitor. Strong competitive pick. GTA 6 itself will not run at 240 fps on a console; the headroom is for other games.",
    specs: [
      { label: "Size", value: "27 inch" },
      { label: "Resolution", value: "2560x1440" },
      { label: "Refresh", value: "240 Hz" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 32900 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 34900 },
      { retailer: "walmart", program: "walmart", priceCents: 31900 },
    ],
  }),
  product({
    slug: "lg-27gp850",
    name: "LG UltraGear 27GP850-B",
    brand: "LG",
    category: "display",
    platforms: ["ps5", "xbox", "pc"],
    bias: "competitive",
    quality: 80,
    summary:
      "27-inch 180 Hz QHD monitor. A mid competitive screen in the sample catalog.",
    specs: [
      { label: "Size", value: "27 inch" },
      { label: "Resolution", value: "2560x1440" },
      { label: "Refresh", value: "180 Hz" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 27900 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 29900 },
      { retailer: "walmart", program: "walmart", priceCents: 26900 },
    ],
  }),
  product({
    slug: "dell-g2724d",
    name: "Dell G2724D 27-inch",
    brand: "Dell",
    category: "display",
    platforms: ["ps5", "xbox", "pc"],
    bias: "competitive",
    quality: 76,
    summary:
      "27-inch 165 Hz QHD monitor. The value competitive screen once the console has taken the first slice of the budget.",
    specs: [
      { label: "Size", value: "27 inch" },
      { label: "Resolution", value: "2560x1440" },
      { label: "Refresh", value: "165 Hz" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 19900 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 21900 },
      { retailer: "walmart", program: "walmart", priceCents: 18900 },
    ],
  }),
  product({
    slug: "aoc-24g4",
    name: "AOC 24G4 24-inch",
    brand: "AOC",
    category: "display",
    platforms: ["ps5", "xbox", "pc"],
    bias: "competitive",
    quality: 64,
    summary:
      "24-inch 165 Hz 1080p monitor. The cheapest display in the sample catalog. Fine for a desk, small for a cinematic open world.",
    specs: [
      { label: "Size", value: "24 inch" },
      { label: "Resolution", value: "1920x1080" },
      { label: "Refresh", value: "165 Hz" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 12900 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 13900 },
      { retailer: "walmart", program: "walmart", priceCents: 11900 },
    ],
  }),
  product({
    slug: "sony-pulse-elite",
    name: "PlayStation Pulse Elite",
    brand: "Sony",
    category: "headset",
    platforms: ["ps5", "pc"],
    bias: "competitive",
    quality: 78,
    summary:
      "PS5 wireless headset with a planar magnetic driver. Not an Xbox headset. Sits just over the $100 line in this sample catalog.",
    specs: [
      { label: "Connection", value: "PlayStation Link / USB" },
      { label: "Platform", value: "PS5 and PC" },
      { label: "Mic", value: "Retractable" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 14800 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 14800 },
      { retailer: "walmart", program: "walmart", priceCents: 13900 },
    ],
  }),
  product({
    slug: "steelseries-arctis-nova-7",
    name: "SteelSeries Arctis Nova 7",
    brand: "SteelSeries",
    category: "headset",
    platforms: ["ps5", "xbox", "pc"],
    bias: "neutral",
    quality: 82,
    summary:
      "Wireless headset that works on both consoles and PC. The sample catalog's default long-session pick when the budget is not chasing a specialist.",
    specs: [
      { label: "Connection", value: "2.4 GHz wireless" },
      { label: "Platform", value: "PS5, Xbox, PC" },
      { label: "Battery", value: "About 30 hours" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 16900 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 17900 },
      { retailer: "target", program: "target", priceCents: 15900 },
    ],
  }),
  product({
    slug: "hyperx-cloud-iii",
    name: "HyperX Cloud III",
    brand: "HyperX",
    category: "headset",
    platforms: ["ps5", "xbox", "pc"],
    bias: "neutral",
    quality: 74,
    summary:
      "Wired headset under $100 in this sample catalog. Comfortable for long sessions and works on both consoles.",
    specs: [
      { label: "Connection", value: "Wired 3.5 mm / USB" },
      { label: "Platform", value: "PS5, Xbox, PC" },
      { label: "Mic", value: "Detachable" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 9900 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 9900 },
      { retailer: "walmart", program: "walmart", priceCents: 8900, inStock: false },
    ],
  }),
  product({
    slug: "turtle-beach-stealth-600",
    name: "Turtle Beach Stealth 600 Gen 3",
    brand: "Turtle Beach",
    category: "headset",
    platforms: ["ps5", "xbox", "pc"],
    bias: "competitive",
    quality: 68,
    summary:
      "Wireless headset under $100 in the sample catalog. The budget wireless option for couch play.",
    specs: [
      { label: "Connection", value: "Wireless" },
      { label: "Platform", value: "PS5, Xbox, PC" },
      { label: "Mic", value: "Flip-to-mute" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 7900 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 7900 },
      { retailer: "walmart", program: "walmart", priceCents: 6900 },
    ],
  }),
  product({
    slug: "sony-inzone-h9",
    name: "Sony INZONE H9",
    brand: "Sony",
    category: "headset",
    platforms: ["ps5", "pc"],
    bias: "cinematic",
    quality: 84,
    summary:
      "Over-ear wireless headset tuned for a wider soundstage. PS5 and PC only in this catalog. Not the under-$100 pick.",
    specs: [
      { label: "Connection", value: "2.4 GHz / Bluetooth" },
      { label: "Platform", value: "PS5 and PC" },
      { label: "Noise cancelling", value: "Yes" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 19800 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 22800 },
      { retailer: "walmart", program: "walmart", priceCents: 18900 },
    ],
  }),
  product({
    slug: "logitech-g-pro-x-2",
    name: "Logitech G Pro X 2 Lightspeed",
    brand: "Logitech",
    category: "headset",
    platforms: ["ps5", "xbox", "pc"],
    bias: "competitive",
    quality: 90,
    summary:
      "Top competitive headset in the sample catalog. Graphene drivers, wireless. Worth it when the headset allocation is large.",
    specs: [
      { label: "Connection", value: "Lightspeed wireless" },
      { label: "Platform", value: "PS5, Xbox, PC" },
      { label: "Driver", value: "50 mm graphene" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 22900 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 24900 },
      { retailer: "target", program: "target", priceCents: 21900 },
    ],
  }),
  product({
    slug: "dualsense",
    name: "DualSense Wireless Controller",
    brand: "Sony",
    category: "controller",
    platforms: ["ps5", "pc"],
    bias: "neutral",
    quality: 80,
    summary:
      "Standard PS5 pad. Adaptive triggers are the ones GTA 6 driving is likely to use. Also works on PC, not on Xbox.",
    specs: [
      { label: "Platform", value: "PS5 and PC" },
      { label: "Features", value: "Adaptive triggers, haptics" },
      { label: "Battery", value: "Built-in" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 6900 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 6900 },
      { retailer: "walmart", program: "walmart", priceCents: 6400 },
    ],
  }),
  product({
    slug: "dualsense-edge",
    name: "DualSense Edge",
    brand: "Sony",
    category: "controller",
    platforms: ["ps5", "pc"],
    bias: "competitive",
    quality: 90,
    summary:
      "PS5 pro controller with back buttons and replaceable sticks. A competitive upgrade, not required to play.",
    specs: [
      { label: "Platform", value: "PS5 and PC" },
      { label: "Features", value: "Back buttons, swappable sticks" },
      { label: "Profile", value: "On-controller" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 19900 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 19900 },
      { retailer: "target", program: "target", priceCents: 18900 },
    ],
  }),
  product({
    slug: "xbox-wireless",
    name: "Xbox Wireless Controller",
    brand: "Microsoft",
    category: "controller",
    platforms: ["xbox", "pc"],
    bias: "neutral",
    quality: 78,
    summary:
      "Standard Xbox pad. The carry-over controller for a PC-later plan because it already works on PC and Xbox.",
    specs: [
      { label: "Platform", value: "Xbox and PC" },
      { label: "Connection", value: "Xbox wireless / USB / Bluetooth" },
      { label: "Battery", value: "AA or play-and-charge kit" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 6400 },
      { retailer: "walmart", program: "walmart", priceCents: 5900 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 6400 },
    ],
  }),
  product({
    slug: "xbox-elite-2",
    name: "Xbox Elite Wireless Controller Series 2",
    brand: "Microsoft",
    category: "controller",
    platforms: ["xbox", "pc"],
    bias: "competitive",
    quality: 88,
    summary:
      "Xbox pro pad with paddles and swappable parts. Competitive upgrade for Series consoles and PC.",
    specs: [
      { label: "Platform", value: "Xbox and PC" },
      { label: "Features", value: "Paddles, hair triggers, swappable sticks" },
      { label: "Battery", value: "Built-in" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 15900 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 17900 },
      { retailer: "walmart", program: "walmart", priceCents: 14900 },
    ],
  }),
  product({
    slug: "samsung-990-evo-2tb",
    name: "Samsung 990 EVO 2 TB",
    brand: "Samsung",
    category: "storage",
    platforms: ["ps5", "pc"],
    bias: "neutral",
    quality: 86,
    summary:
      "2 TB NVMe SSD that fits the PS5 M.2 bay. GTA 6 will be a large install. This is the sample catalog's roomy PS5 drive.",
    specs: [
      { label: "Capacity", value: "2 TB" },
      { label: "Form", value: "M.2 NVMe" },
      { label: "Fits", value: "PS5 internal bay and PC" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 14900 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 15900 },
      { retailer: "walmart", program: "walmart", priceCents: 13900 },
    ],
  }),
  product({
    slug: "wd-black-sn850x-1tb",
    name: "WD_BLACK SN850X 1 TB",
    brand: "Western Digital",
    category: "storage",
    platforms: ["ps5", "pc"],
    bias: "neutral",
    quality: 84,
    summary:
      "1 TB NVMe with a heatsink option commonly used in PS5. The cheaper internal drive in the sample catalog.",
    specs: [
      { label: "Capacity", value: "1 TB" },
      { label: "Form", value: "M.2 NVMe" },
      { label: "Fits", value: "PS5 internal bay and PC" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 8900 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 9900 },
      { retailer: "walmart", program: "walmart", priceCents: 7900 },
    ],
  }),
  product({
    slug: "seagate-xbox-card-1tb",
    name: "Seagate Xbox Storage Expansion Card 1 TB",
    brand: "Seagate",
    category: "storage",
    platforms: ["xbox"],
    bias: "neutral",
    quality: 80,
    summary:
      "Official-style expansion card for Xbox Series. Native games run from the card. A USB SSD does not do that on Series consoles.",
    specs: [
      { label: "Capacity", value: "1 TB" },
      { label: "Form", value: "Xbox expansion card" },
      { label: "Fits", value: "Xbox Series only" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 14900 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 15900 },
      { retailer: "walmart", program: "walmart", priceCents: 13900 },
    ],
  }),
  product({
    slug: "samsung-t7-1tb",
    name: "Samsung T7 1 TB",
    brand: "Samsung",
    category: "storage",
    platforms: ["xbox", "pc"],
    bias: "neutral",
    quality: 58,
    summary:
      "Portable USB SSD. Fine for PC files and for Xbox media. PS5 cannot launch native PS5 games from USB, so this drive is not offered for PS5.",
    specs: [
      { label: "Capacity", value: "1 TB" },
      { label: "Form", value: "USB portable SSD" },
      { label: "Fits", value: "Xbox storage of compatible games, and PC" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 9900 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 10900 },
      { retailer: "walmart", program: "walmart", priceCents: 8900 },
    ],
  }),
  product({
    slug: "secretlab-titan",
    name: "Secretlab Titan Evo",
    brand: "Secretlab",
    category: "chair",
    platforms: ["ps5", "xbox", "pc"],
    bias: "neutral",
    quality: 86,
    summary:
      "Gaming chair in the sample catalog. Only recommended when you opt into a chair and the leftover budget can carry it.",
    specs: [
      { label: "Type", value: "Gaming chair" },
      { label: "Size", value: "Regular or XL, check the listing" },
      { label: "Optional", value: "Off unless you ask for a chair" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 54900 },
      { retailer: "bestbuy", program: "bestbuy", priceCents: 54900 },
    ],
  }),
  product({
    slug: "ikea-markus",
    name: "IKEA MARKUS",
    brand: "IKEA",
    category: "chair",
    platforms: ["ps5", "xbox", "pc"],
    bias: "neutral",
    quality: 62,
    summary:
      "Basic office chair. The cheaper chair in the sample catalog for long sessions without spending flagship money.",
    specs: [
      { label: "Type", value: "Office chair" },
      { label: "Adjust", value: "Height and tilt" },
      { label: "Optional", value: "Off unless you ask for a chair" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 22900 },
      { retailer: "walmart", program: "walmart", priceCents: 19900 },
    ],
  }),
  product({
    slug: "flexispot-e7",
    name: "FlexiSpot E7",
    brand: "FlexiSpot",
    category: "desk",
    platforms: ["ps5", "xbox", "pc"],
    bias: "neutral",
    quality: 80,
    summary:
      "Standing desk frame in the sample catalog. Optional. A monitor arms onto this more cleanly than a 55-inch TV does.",
    specs: [
      { label: "Type", value: "Electric standing desk" },
      { label: "Top", value: "Sold separately in many listings" },
      { label: "Optional", value: "Off unless you ask for a desk" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 39900 },
      { retailer: "walmart", program: "walmart", priceCents: 42900 },
    ],
  }),
  product({
    slug: "ikea-lagkapten-alex",
    name: "IKEA LAGKAPTEN / ALEX",
    brand: "IKEA",
    category: "desk",
    platforms: ["ps5", "xbox", "pc"],
    bias: "neutral",
    quality: 58,
    summary:
      "Simple desk top plus drawer unit. The budget desk in the sample catalog.",
    specs: [
      { label: "Type", value: "Fixed desk" },
      { label: "Pieces", value: "Tabletop and drawer unit" },
      { label: "Optional", value: "Off unless you ask for a desk" },
    ],
    offers: [
      { retailer: "amazon", program: "amazon", priceCents: 18900 },
      { retailer: "walmart", program: "walmart", priceCents: 17900 },
    ],
  }),
];

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlArray(values) {
  return `array[${values.map((value) => sqlString(value)).join(", ")}]::text[]`;
}

function seedSql() {
  const lines = [];
  lines.push("-- Generated by scripts/build-catalog.mjs. Do not edit by hand.");
  lines.push("-- Sample prices. Not live retailer quotes.");
  lines.push("begin;");
  lines.push("truncate table public.click_events, public.price_history, public.offers, public.products restart identity cascade;");

  for (const item of products) {
    lines.push(
      `insert into public.products (slug, name, brand, category, platforms, bias, quality, summary, specs, sample_note) values (${[
        sqlString(item.slug),
        sqlString(item.name),
        sqlString(item.brand),
        sqlString(item.category),
        sqlArray(item.platforms),
        sqlString(item.bias),
        String(item.quality),
        sqlString(item.summary),
        `${sqlString(JSON.stringify(item.specs))}::jsonb`,
        sqlString(item.sampleNote),
      ].join(", ")});`,
    );
    for (const offer of item.offers) {
      lines.push(
        `insert into public.offers (id, product_slug, retailer, program, price_cents, seed_price_cents, currency, url, in_stock, external_sku, last_checked_at) values (${[
          sqlString(offer.id),
          sqlString(offer.productSlug),
          sqlString(offer.retailer),
          sqlString(offer.program),
          String(offer.priceCents),
          String(offer.seedPriceCents),
          sqlString(offer.currency),
          sqlString(offer.url),
          offer.inStock ? "true" : "false",
          sqlString(offer.externalSku),
          `${sqlString(offer.lastCheckedAt)}::timestamptz`,
        ].join(", ")});`,
      );
      for (const point of offer.history) {
        lines.push(
          `insert into public.price_history (offer_id, price_cents, recorded_at) values (${[
            sqlString(offer.id),
            String(point.priceCents),
            `${sqlString(point.recordedAt)}::timestamptz`,
          ].join(", ")});`,
        );
      }
    }
  }

  lines.push("commit;");
  lines.push("");
  return lines.join("\n");
}

const jsonPath = path.join(root, "src/data/catalog.json");
const seedPath = path.join(root, "supabase/seed.sql");
const migrationPath = path.join(
  root,
  "supabase/migrations/20261119180100_seed_catalog.sql",
);

mkdirSync(path.dirname(jsonPath), { recursive: true });
mkdirSync(path.dirname(seedPath), { recursive: true });
mkdirSync(path.dirname(migrationPath), { recursive: true });

writeFileSync(jsonPath, `${JSON.stringify(products, null, 2)}\n`);
const sql = seedSql();
writeFileSync(seedPath, sql);
writeFileSync(
  migrationPath,
  `-- Applies the sample catalog once, when this migration runs.\n${sql}`,
);

const offerCount = products.reduce((sum, item) => sum + item.offers.length, 0);
console.log(`Wrote ${products.length} products and ${offerCount} offers.`);
