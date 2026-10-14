import * as text from "../../../../kit/text.js";
import { DefaultBidRuleSummary } from "./default-bid-rule-summary.js";

/** How screens and exports show a default bid rule summary. */
export class DefaultBidRuleSummaryView {
  code: string;
  label: string;
  clicks: string;
  title: string;
  sequence: string;
  campaignRef: string;
  maximum: string;
  cost: string;
  startsAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    clicks: string,
    title: string,
    sequence: string,
    campaignRef: string,
    maximum: string,
    cost: string,
    startsAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.title = title;
    this.sequence = sequence;
    this.campaignRef = campaignRef;
    this.maximum = maximum;
    this.cost = cost;
    this.startsAtText = startsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultBidRuleSummaryView(item: DefaultBidRuleSummary): DefaultBidRuleSummaryView {
  return new DefaultBidRuleSummaryView(
    text.truncate(item.code, 40),
    item.label,
    String(item.clicks),
    text.truncate(item.title, 64),
    String(item.sequence),
    text.truncate(item.campaignRef, 40),
    item.maximum.toFixed(2),
    item.cost.toFixed(2),
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultBidRuleSummaryViews(items: DefaultBidRuleSummary[]): DefaultBidRuleSummaryView[] {
  const views: DefaultBidRuleSummaryView[] = [];
  for (const item of items) {
    views.push(toDefaultBidRuleSummaryView(item));
  }
  return views;
}

export function sumDefaultBidRuleSummaryView(view: DefaultBidRuleSummaryView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedClicks + parsedSequence + parsedMaximum;
}
