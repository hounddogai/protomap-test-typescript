import * as text from "../../../../kit/text.js";
import { TierBundle } from "./tier-bundle.js";

/** How screens and exports show a tier bundle. */
export class TierBundleView {
  code: string;
  nameText: string;
  approvedText: string;
  description: string;
  startsAt: string;
  utmSource: string;
  regionText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    approvedText: string,
    description: string,
    startsAt: string,
    utmSource: string,
    regionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.approvedText = approvedText;
    this.description = description;
    this.startsAt = startsAt;
    this.utmSource = utmSource;
    this.regionText = regionText;
    this.statusLabel = statusLabel;
  }
}

export function toTierBundleView(item: TierBundle): TierBundleView {
  return new TierBundleView(
    item.code,
    item.name,
    `${item.approved}`,
    item.description,
    String(item.startsAt),
    text.truncate(item.utmSource, 80),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toTierBundleViews(items: TierBundle[]): TierBundleView[] {
  const views: TierBundleView[] = [];
  for (const item of items) {
    views.push(toTierBundleView(item));
  }
  return views;
}

export function sumTierBundleView(view: TierBundleView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedStartsAt;
}
