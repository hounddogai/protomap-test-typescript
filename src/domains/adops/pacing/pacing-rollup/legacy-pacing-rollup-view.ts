import * as text from "../../../../kit/text.js";
import { LegacyPacingRollup } from "./legacy-pacing-rollup.js";

/** How screens and exports show a legacy pacing rollup. */
export class LegacyPacingRollupView {
  codeText: string;
  label: string;
  archived: string;
  category: string;
  country: string;
  currency: string;
  bid: string;
  locale: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    archived: string,
    category: string,
    country: string,
    currency: string,
    bid: string,
    locale: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.archived = archived;
    this.category = category;
    this.country = country;
    this.currency = currency;
    this.bid = bid;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyPacingRollupView(item: LegacyPacingRollup): LegacyPacingRollupView {
  return new LegacyPacingRollupView(
    item.code,
    text.truncate(item.label, 120),
    `${item.archived}`,
    text.truncate(item.category, 40),
    item.country,
    text.truncate(item.currency, 40),
    item.bid.toFixed(2),
    text.truncate(item.locale, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyPacingRollupViews(items: LegacyPacingRollup[]): LegacyPacingRollupView[] {
  const views: LegacyPacingRollupView[] = [];
  for (const item of items) {
    views.push(toLegacyPacingRollupView(item));
  }
  return views;
}

export function sumLegacyPacingRollupView(view: LegacyPacingRollupView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedBid;
}
