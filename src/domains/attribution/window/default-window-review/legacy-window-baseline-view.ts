import * as text from "../../../../kit/text.js";
import { LegacyWindowBaseline } from "./legacy-window-baseline.js";

/** How screens and exports show a legacy window baseline. */
export class LegacyWindowBaselineView {
  code: string;
  labelText: string;
  ratioText: string;
  budget: string;
  utmSource: string;
  marginText: string;
  categoryText: string;
  channelText: string;
  startsAt: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    ratioText: string,
    budget: string,
    utmSource: string,
    marginText: string,
    categoryText: string,
    channelText: string,
    startsAt: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.ratioText = ratioText;
    this.budget = budget;
    this.utmSource = utmSource;
    this.marginText = marginText;
    this.categoryText = categoryText;
    this.channelText = channelText;
    this.startsAt = startsAt;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyWindowBaselineView(item: LegacyWindowBaseline): LegacyWindowBaselineView {
  return new LegacyWindowBaselineView(
    item.code,
    text.truncate(item.label, 40),
    item.ratio.toFixed(2),
    item.budget.toFixed(2),
    item.utmSource,
    item.margin.toFixed(2),
    item.category,
    item.channel,
    String(item.startsAt),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyWindowBaselineViews(items: LegacyWindowBaseline[]): LegacyWindowBaselineView[] {
  const views: LegacyWindowBaselineView[] = [];
  for (const item of items) {
    views.push(toLegacyWindowBaselineView(item));
  }
  return views;
}

export function sumLegacyWindowBaselineView(view: LegacyWindowBaselineView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedRatio + parsedBudget + parsedMargin;
}
