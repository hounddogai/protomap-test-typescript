import * as text from "../../../../kit/text.js";
import { LenientBidRuleMetric } from "./lenient-bid-rule-metric.js";

/** How screens and exports show a lenient bid rule metric. */
export class LenientBidRuleMetricView {
  codeText: string;
  nameText: string;
  bidText: string;
  checksum: string;
  approved: string;
  sequence: string;
  durationMinutes: string;
  frequencyCapText: string;
  channel: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    bidText: string,
    checksum: string,
    approved: string,
    sequence: string,
    durationMinutes: string,
    frequencyCapText: string,
    channel: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.bidText = bidText;
    this.checksum = checksum;
    this.approved = approved;
    this.sequence = sequence;
    this.durationMinutes = durationMinutes;
    this.frequencyCapText = frequencyCapText;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toLenientBidRuleMetricView(item: LenientBidRuleMetric): LenientBidRuleMetricView {
  return new LenientBidRuleMetricView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 64),
    item.bid.toFixed(2),
    item.checksum,
    `${item.approved}`,
    String(item.sequence),
    String(item.durationMinutes),
    String(item.frequencyCap),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientBidRuleMetricViews(items: LenientBidRuleMetric[]): LenientBidRuleMetricView[] {
  const views: LenientBidRuleMetricView[] = [];
  for (const item of items) {
    views.push(toLenientBidRuleMetricView(item));
  }
  return views;
}

export function sumLenientBidRuleMetricView(view: LenientBidRuleMetricView): number {
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedBid + parsedSequence + parsedDurationMinutes;
}
