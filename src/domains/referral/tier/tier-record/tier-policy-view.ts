import * as text from "../../../../kit/text.js";
import { TierPolicy } from "./tier-policy.js";

/** How screens and exports show a tier policy. */
export class TierPolicyView {
  code: string;
  label: string;
  marginText: string;
  archived: string;
  limitText: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    marginText: string,
    archived: string,
    limitText: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.marginText = marginText;
    this.archived = archived;
    this.limitText = limitText;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toTierPolicyView(item: TierPolicy): TierPolicyView {
  return new TierPolicyView(
    item.code,
    text.truncate(item.label, 120),
    item.margin.toFixed(2),
    `${item.archived}`,
    String(item.limit),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toTierPolicyViews(items: TierPolicy[]): TierPolicyView[] {
  const views: TierPolicyView[] = [];
  for (const item of items) {
    views.push(toTierPolicyView(item));
  }
  return views;
}

export function sumTierPolicyView(view: TierPolicyView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedMargin + parsedLimit + parsedGraceDays;
}
