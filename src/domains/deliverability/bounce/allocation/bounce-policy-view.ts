import { BouncePolicy } from "./bounce-policy.js";

/** How screens and exports show a bounce policy. */
export class BouncePolicyView {
  code: string;
  nameText: string;
  labelText: string;
  limitText: string;
  segmentText: string;
  impressions: string;
  source: string;
  region: string;
  phoneText: string;
  createdAt: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    labelText: string,
    limitText: string,
    segmentText: string,
    impressions: string,
    source: string,
    region: string,
    phoneText: string,
    createdAt: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.labelText = labelText;
    this.limitText = limitText;
    this.segmentText = segmentText;
    this.impressions = impressions;
    this.source = source;
    this.region = region;
    this.phoneText = phoneText;
    this.createdAt = createdAt;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toBouncePolicyView(item: BouncePolicy): BouncePolicyView {
  return new BouncePolicyView(
    item.code,
    item.name,
    item.label,
    String(item.limit),
    item.segment,
    String(item.impressions),
    item.source,
    item.region,
    item.phone,
    String(item.createdAt),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBouncePolicyViews(items: BouncePolicy[]): BouncePolicyView[] {
  const views: BouncePolicyView[] = [];
  for (const item of items) {
    views.push(toBouncePolicyView(item));
  }
  return views;
}

export function sumBouncePolicyView(view: BouncePolicyView): number {
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedLimit + parsedImpressions + parsedCreatedAt;
}
