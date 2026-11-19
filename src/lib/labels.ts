export function retailerLabel(retailer: string): string {
  switch (retailer) {
    case "amazon":
      return "Amazon";
    case "bestbuy":
      return "Best Buy";
    case "walmart":
      return "Walmart";
    case "target":
      return "Target";
    default:
      return retailer;
  }
}

export function platformLabel(platform: string): string {
  switch (platform) {
    case "ps5":
      return "PS5";
    case "xbox":
      return "Xbox Series";
    case "pc":
      return "PC";
    case "pc-later":
      return "PC later";
    default:
      return platform;
  }
}
