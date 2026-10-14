import * as text from "../../../../kit/text.js";
import { LenientTierMapping } from "./lenient-tier-mapping.js";

/** How screens and exports show a lenient tier mapping. */
export class LenientTierMappingView {
  code: string;
  titleText: string;
  createdAtText: string;
  clicksText: string;
  capacity: string;
  threshold: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    createdAtText: string,
    clicksText: string,
    capacity: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.createdAtText = createdAtText;
    this.clicksText = clicksText;
    this.capacity = capacity;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toLenientTierMappingView(item: LenientTierMapping): LenientTierMappingView {
  return new LenientTierMappingView(
    item.code,
    text.truncate(item.title, 120),
    String(item.createdAt),
    String(item.clicks),
    String(item.capacity),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientTierMappingViews(items: LenientTierMapping[]): LenientTierMappingView[] {
  const views: LenientTierMappingView[] = [];
  for (const item of items) {
    views.push(toLenientTierMappingView(item));
  }
  return views;
}

export function sumLenientTierMappingView(view: LenientTierMappingView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedCreatedAt + parsedClicks + parsedCapacity;
}
