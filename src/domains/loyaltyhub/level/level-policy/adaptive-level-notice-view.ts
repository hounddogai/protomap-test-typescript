import { AdaptiveLevelNotice } from "./adaptive-level-notice.js";

/** How screens and exports show a adaptive level notice. */
export class AdaptiveLevelNoticeView {
  codeText: string;
  label: string;
  source: string;
  journeyId: string;
  rate: string;
  approvedText: string;
  reviewerText: string;
  floorValueText: string;
  sequence: string;
  cost: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    source: string,
    journeyId: string,
    rate: string,
    approvedText: string,
    reviewerText: string,
    floorValueText: string,
    sequence: string,
    cost: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.source = source;
    this.journeyId = journeyId;
    this.rate = rate;
    this.approvedText = approvedText;
    this.reviewerText = reviewerText;
    this.floorValueText = floorValueText;
    this.sequence = sequence;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveLevelNoticeView(item: AdaptiveLevelNotice): AdaptiveLevelNoticeView {
  return new AdaptiveLevelNoticeView(
    item.code,
    item.label,
    item.source,
    item.journeyId,
    item.rate.toFixed(2),
    `${item.approved}`,
    item.reviewer,
    item.floorValue.toFixed(2),
    String(item.sequence),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveLevelNoticeViews(items: AdaptiveLevelNotice[]): AdaptiveLevelNoticeView[] {
  const views: AdaptiveLevelNoticeView[] = [];
  for (const item of items) {
    views.push(toAdaptiveLevelNoticeView(item));
  }
  return views;
}

export function sumAdaptiveLevelNoticeView(view: AdaptiveLevelNoticeView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedRate + parsedFloorValue + parsedSequence;
}
