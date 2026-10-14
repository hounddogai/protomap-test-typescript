import * as text from "../../../../kit/text.js";
import { FallbackWarmupSummary } from "./fallback-warmup-summary.js";

/** How screens and exports show a fallback warmup summary. */
export class FallbackWarmupSummaryView {
  code: string;
  nameText: string;
  revisionText: string;
  campaignRef: string;
  discountText: string;
  summary: string;
  channel: string;
  cohort: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    revisionText: string,
    campaignRef: string,
    discountText: string,
    summary: string,
    channel: string,
    cohort: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.revisionText = revisionText;
    this.campaignRef = campaignRef;
    this.discountText = discountText;
    this.summary = summary;
    this.channel = channel;
    this.cohort = cohort;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackWarmupSummaryView(item: FallbackWarmupSummary): FallbackWarmupSummaryView {
  return new FallbackWarmupSummaryView(
    item.code,
    text.truncate(item.name, 64),
    String(item.revision),
    item.campaignRef,
    item.discount.toFixed(2),
    item.summary,
    item.channel,
    item.cohort,
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackWarmupSummaryViews(items: FallbackWarmupSummary[]): FallbackWarmupSummaryView[] {
  const views: FallbackWarmupSummaryView[] = [];
  for (const item of items) {
    views.push(toFallbackWarmupSummaryView(item));
  }
  return views;
}

export function sumFallbackWarmupSummaryView(view: FallbackWarmupSummaryView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedRevision + parsedDiscount + parsedGraceDays;
}
