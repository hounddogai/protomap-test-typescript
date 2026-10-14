import * as text from "../../../../kit/text.js";
import { ManualBidRuleProfile } from "./manual-bid-rule-profile.js";

/** How screens and exports show a manual bid rule profile. */
export class ManualBidRuleProfileView {
  code: string;
  label: string;
  timezone: string;
  name: string;
  marginText: string;
  limitText: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    timezone: string,
    name: string,
    marginText: string,
    limitText: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.name = name;
    this.marginText = marginText;
    this.limitText = limitText;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toManualBidRuleProfileView(item: ManualBidRuleProfile): ManualBidRuleProfileView {
  return new ManualBidRuleProfileView(
    item.code,
    item.label,
    text.truncate(item.timezone, 40),
    text.truncate(item.name, 80),
    item.margin.toFixed(2),
    String(item.limit),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualBidRuleProfileViews(items: ManualBidRuleProfile[]): ManualBidRuleProfileView[] {
  const views: ManualBidRuleProfileView[] = [];
  for (const item of items) {
    views.push(toManualBidRuleProfileView(item));
  }
  return views;
}

export function sumManualBidRuleProfileView(view: ManualBidRuleProfileView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedMargin + parsedLimit + parsedWeight;
}
