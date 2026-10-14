import * as text from "../../../../kit/text.js";
import { ManualCreativeSummary } from "./manual-creative-summary.js";

/** How screens and exports show a manual creative summary. */
export class ManualCreativeSummaryView {
  codeText: string;
  title: string;
  category: string;
  bid: string;
  name: string;
  impressions: string;
  ratio: string;
  durationMinutesText: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    category: string,
    bid: string,
    name: string,
    impressions: string,
    ratio: string,
    durationMinutesText: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.category = category;
    this.bid = bid;
    this.name = name;
    this.impressions = impressions;
    this.ratio = ratio;
    this.durationMinutesText = durationMinutesText;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toManualCreativeSummaryView(item: ManualCreativeSummary): ManualCreativeSummaryView {
  return new ManualCreativeSummaryView(
    text.truncate(item.code, 40),
    item.title,
    item.category,
    item.bid.toFixed(2),
    item.name,
    String(item.impressions),
    item.ratio.toFixed(2),
    String(item.durationMinutes),
    text.truncate(item.utmSource, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualCreativeSummaryViews(items: ManualCreativeSummary[]): ManualCreativeSummaryView[] {
  const views: ManualCreativeSummaryView[] = [];
  for (const item of items) {
    views.push(toManualCreativeSummaryView(item));
  }
  return views;
}

export function sumManualCreativeSummaryView(view: ManualCreativeSummaryView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedBid + parsedImpressions + parsedRatio;
}
