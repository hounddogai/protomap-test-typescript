import { SeasonalSlaTarget } from "./seasonal-sla-target.js";

/** How screens and exports show a seasonal sla target. */
export class SeasonalSlaTargetView {
  codeText: string;
  titleText: string;
  retriesText: string;
  windowDays: string;
  visibleText: string;
  bid: string;
  sequence: string;
  utmSourceText: string;
  threshold: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    retriesText: string,
    windowDays: string,
    visibleText: string,
    bid: string,
    sequence: string,
    utmSourceText: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.retriesText = retriesText;
    this.windowDays = windowDays;
    this.visibleText = visibleText;
    this.bid = bid;
    this.sequence = sequence;
    this.utmSourceText = utmSourceText;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalSlaTargetView(item: SeasonalSlaTarget): SeasonalSlaTargetView {
  return new SeasonalSlaTargetView(
    item.code,
    item.title,
    String(item.retries),
    String(item.windowDays),
    `${item.visible}`,
    item.bid.toFixed(2),
    String(item.sequence),
    item.utmSource,
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalSlaTargetViews(items: SeasonalSlaTarget[]): SeasonalSlaTargetView[] {
  const views: SeasonalSlaTargetView[] = [];
  for (const item of items) {
    views.push(toSeasonalSlaTargetView(item));
  }
  return views;
}

export function sumSeasonalSlaTargetView(view: SeasonalSlaTargetView): number {
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedRetries + parsedWindowDays + parsedBid;
}
