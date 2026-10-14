import * as text from "../../../../kit/text.js";
import { TieredRetentionDraft } from "./tiered-retention-draft.js";

/** How screens and exports show a tiered retention draft. */
export class TieredRetentionDraftView {
  code: string;
  name: string;
  region: string;
  openRate: string;
  limitText: string;
  discount: string;
  costText: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    region: string,
    openRate: string,
    limitText: string,
    discount: string,
    costText: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.openRate = openRate;
    this.limitText = limitText;
    this.discount = discount;
    this.costText = costText;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toTieredRetentionDraftView(item: TieredRetentionDraft): TieredRetentionDraftView {
  return new TieredRetentionDraftView(
    item.code,
    item.name,
    item.region,
    item.openRate.toFixed(2),
    String(item.limit),
    item.discount.toFixed(2),
    item.cost.toFixed(2),
    text.truncate(item.timezone, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredRetentionDraftViews(items: TieredRetentionDraft[]): TieredRetentionDraftView[] {
  const views: TieredRetentionDraftView[] = [];
  for (const item of items) {
    views.push(toTieredRetentionDraftView(item));
  }
  return views;
}

export function sumTieredRetentionDraftView(view: TieredRetentionDraftView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedOpenRate + parsedLimit + parsedDiscount;
}
