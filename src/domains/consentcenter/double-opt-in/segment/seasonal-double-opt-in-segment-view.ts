import { SeasonalDoubleOptInSegment } from "./seasonal-double-opt-in-segment.js";

/** How screens and exports show a seasonal double opt in segment. */
export class SeasonalDoubleOptInSegmentView {
  codeText: string;
  label: string;
  endsAtText: string;
  retries: string;
  maximumText: string;
  bidText: string;
  cost: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    endsAtText: string,
    retries: string,
    maximumText: string,
    bidText: string,
    cost: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.endsAtText = endsAtText;
    this.retries = retries;
    this.maximumText = maximumText;
    this.bidText = bidText;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalDoubleOptInSegmentView(item: SeasonalDoubleOptInSegment): SeasonalDoubleOptInSegmentView {
  return new SeasonalDoubleOptInSegmentView(
    item.code,
    item.label,
    String(item.endsAt),
    String(item.retries),
    item.maximum.toFixed(2),
    item.bid.toFixed(2),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalDoubleOptInSegmentViews(items: SeasonalDoubleOptInSegment[]): SeasonalDoubleOptInSegmentView[] {
  const views: SeasonalDoubleOptInSegmentView[] = [];
  for (const item of items) {
    views.push(toSeasonalDoubleOptInSegmentView(item));
  }
  return views;
}

export function sumSeasonalDoubleOptInSegmentView(view: SeasonalDoubleOptInSegmentView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  return parsedEndsAt + parsedRetries + parsedMaximum;
}
