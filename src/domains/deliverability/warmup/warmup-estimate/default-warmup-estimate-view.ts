import { DefaultWarmupEstimate } from "./default-warmup-estimate.js";

/** How screens and exports show a default warmup estimate. */
export class DefaultWarmupEstimateView {
  codeText: string;
  title: string;
  impressions: string;
  name: string;
  notesText: string;
  utmSourceText: string;
  journeyId: string;
  bid: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    impressions: string,
    name: string,
    notesText: string,
    utmSourceText: string,
    journeyId: string,
    bid: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.impressions = impressions;
    this.name = name;
    this.notesText = notesText;
    this.utmSourceText = utmSourceText;
    this.journeyId = journeyId;
    this.bid = bid;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultWarmupEstimateView(item: DefaultWarmupEstimate): DefaultWarmupEstimateView {
  return new DefaultWarmupEstimateView(
    item.code,
    item.title,
    String(item.impressions),
    item.name,
    item.notes,
    item.utmSource,
    item.journeyId,
    item.bid.toFixed(2),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultWarmupEstimateViews(items: DefaultWarmupEstimate[]): DefaultWarmupEstimateView[] {
  const views: DefaultWarmupEstimateView[] = [];
  for (const item of items) {
    views.push(toDefaultWarmupEstimateView(item));
  }
  return views;
}

export function sumDefaultWarmupEstimateView(view: DefaultWarmupEstimateView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedImpressions + parsedBid;
}
