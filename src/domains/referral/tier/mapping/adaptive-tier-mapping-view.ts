import { AdaptiveTierMapping } from "./adaptive-tier-mapping.js";

/** How screens and exports show a adaptive tier mapping. */
export class AdaptiveTierMappingView {
  code: string;
  label: string;
  region: string;
  updatedAt: string;
  statusLabel: string;

  constructor(code: string, label: string, region: string, updatedAt: string, statusLabel: string) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveTierMappingView(item: AdaptiveTierMapping): AdaptiveTierMappingView {
  return new AdaptiveTierMappingView(
    item.code,
    item.label,
    item.region,
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveTierMappingViews(items: AdaptiveTierMapping[]): AdaptiveTierMappingView[] {
  const views: AdaptiveTierMappingView[] = [];
  for (const item of items) {
    views.push(toAdaptiveTierMappingView(item));
  }
  return views;
}

export function sumAdaptiveTierMappingView(view: AdaptiveTierMappingView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedUpdatedAt;
}
