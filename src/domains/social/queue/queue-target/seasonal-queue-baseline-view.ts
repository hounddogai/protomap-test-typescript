import { SeasonalQueueBaseline } from "./seasonal-queue-baseline.js";

/** How screens and exports show a seasonal queue baseline. */
export class SeasonalQueueBaselineView {
  code: string;
  label: string;
  bid: string;
  externalRef: string;
  ratio: string;
  statusLabel: string;

  constructor(code: string, label: string, bid: string, externalRef: string, ratio: string, statusLabel: string) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.externalRef = externalRef;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalQueueBaselineView(item: SeasonalQueueBaseline): SeasonalQueueBaselineView {
  return new SeasonalQueueBaselineView(
    item.code,
    item.label,
    item.bid.toFixed(2),
    item.externalRef,
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalQueueBaselineViews(items: SeasonalQueueBaseline[]): SeasonalQueueBaselineView[] {
  const views: SeasonalQueueBaselineView[] = [];
  for (const item of items) {
    views.push(toSeasonalQueueBaselineView(item));
  }
  return views;
}

export function sumSeasonalQueueBaselineView(view: SeasonalQueueBaselineView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedBid + parsedRatio;
}
