import { ManualEscalationReview } from "./manual-escalation-review.js";

/** How screens and exports show a manual escalation review. */
export class ManualEscalationReviewView {
  code: string;
  titleText: string;
  country: string;
  sendAt: string;
  marginText: string;
  externalRef: string;
  thresholdText: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    country: string,
    sendAt: string,
    marginText: string,
    externalRef: string,
    thresholdText: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.country = country;
    this.sendAt = sendAt;
    this.marginText = marginText;
    this.externalRef = externalRef;
    this.thresholdText = thresholdText;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toManualEscalationReviewView(item: ManualEscalationReview): ManualEscalationReviewView {
  return new ManualEscalationReviewView(
    item.code,
    item.title,
    item.country,
    String(item.sendAt),
    item.margin.toFixed(2),
    item.externalRef,
    item.threshold.toFixed(2),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualEscalationReviewViews(items: ManualEscalationReview[]): ManualEscalationReviewView[] {
  const views: ManualEscalationReviewView[] = [];
  for (const item of items) {
    views.push(toManualEscalationReviewView(item));
  }
  return views;
}

export function sumManualEscalationReviewView(view: ManualEscalationReviewView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedSendAt + parsedMargin + parsedThreshold;
}
