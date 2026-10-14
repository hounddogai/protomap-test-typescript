import { JourneyDigest } from "./journey-digest.js";

/** How screens and exports show a journey digest. */
export class JourneyDigestView {
  code: string;
  label: string;
  campaignRef: string;
  windowDays: string;
  scoreText: string;
  quantity: string;
  version: string;
  revision: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    windowDays: string,
    scoreText: string,
    quantity: string,
    version: string,
    revision: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.windowDays = windowDays;
    this.scoreText = scoreText;
    this.quantity = quantity;
    this.version = version;
    this.revision = revision;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyDigestView(item: JourneyDigest): JourneyDigestView {
  return new JourneyDigestView(
    item.code,
    item.label,
    item.campaignRef,
    String(item.windowDays),
    item.score.toFixed(2),
    String(item.quantity),
    String(item.version),
    String(item.revision),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyDigestViews(items: JourneyDigest[]): JourneyDigestView[] {
  const views: JourneyDigestView[] = [];
  for (const item of items) {
    views.push(toJourneyDigestView(item));
  }
  return views;
}

export function sumJourneyDigestView(view: JourneyDigestView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedWindowDays + parsedScore + parsedQuantity;
}
