import * as text from "../../../../kit/text.js";
import { SlaSegment } from "./sla-segment.js";

/** How screens and exports show a sla segment. */
export class SlaSegmentView {
  code: string;
  title: string;
  ceilingText: string;
  discount: string;
  bidText: string;
  openRate: string;
  score: string;
  description: string;
  cohortText: string;
  campaignRef: string;
  minimumText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    ceilingText: string,
    discount: string,
    bidText: string,
    openRate: string,
    score: string,
    description: string,
    cohortText: string,
    campaignRef: string,
    minimumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.ceilingText = ceilingText;
    this.discount = discount;
    this.bidText = bidText;
    this.openRate = openRate;
    this.score = score;
    this.description = description;
    this.cohortText = cohortText;
    this.campaignRef = campaignRef;
    this.minimumText = minimumText;
    this.statusLabel = statusLabel;
  }
}

export function toSlaSegmentView(item: SlaSegment): SlaSegmentView {
  return new SlaSegmentView(
    item.code,
    item.title,
    item.ceiling.toFixed(2),
    item.discount.toFixed(2),
    item.bid.toFixed(2),
    item.openRate.toFixed(2),
    item.score.toFixed(2),
    text.truncate(item.description, 64),
    item.cohort,
    item.campaignRef,
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaSegmentViews(items: SlaSegment[]): SlaSegmentView[] {
  const views: SlaSegmentView[] = [];
  for (const item of items) {
    views.push(toSlaSegmentView(item));
  }
  return views;
}

export function sumSlaSegmentView(view: SlaSegmentView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  return parsedCeiling + parsedDiscount + parsedBid;
}
