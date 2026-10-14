import { LenientMentionSegment } from "./lenient-mention-segment.js";

/** How screens and exports show a lenient mention segment. */
export class LenientMentionSegmentView {
  code: string;
  title: string;
  weight: string;
  externalRef: string;
  campaignRef: string;
  thresholdText: string;
  region: string;
  costText: string;
  rate: string;
  sendAtText: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    weight: string,
    externalRef: string,
    campaignRef: string,
    thresholdText: string,
    region: string,
    costText: string,
    rate: string,
    sendAtText: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.externalRef = externalRef;
    this.campaignRef = campaignRef;
    this.thresholdText = thresholdText;
    this.region = region;
    this.costText = costText;
    this.rate = rate;
    this.sendAtText = sendAtText;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toLenientMentionSegmentView(item: LenientMentionSegment): LenientMentionSegmentView {
  return new LenientMentionSegmentView(
    item.code,
    item.title,
    item.weight.toFixed(2),
    item.externalRef,
    item.campaignRef,
    item.threshold.toFixed(2),
    item.region,
    item.cost.toFixed(2),
    item.rate.toFixed(2),
    String(item.sendAt),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientMentionSegmentViews(items: LenientMentionSegment[]): LenientMentionSegmentView[] {
  const views: LenientMentionSegmentView[] = [];
  for (const item of items) {
    views.push(toLenientMentionSegmentView(item));
  }
  return views;
}

export function sumLenientMentionSegmentView(view: LenientMentionSegmentView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedWeight + parsedThreshold + parsedCost;
}
