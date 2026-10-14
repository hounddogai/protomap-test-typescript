import { CsatSummary } from "./csat-summary.js";

/** How screens and exports show a csat summary. */
export class CsatSummaryView {
  codeText: string;
  label: string;
  reviewer: string;
  bid: string;
  priority: string;
  attemptsText: string;
  maximumText: string;
  pinned: string;
  conversionRate: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    reviewer: string,
    bid: string,
    priority: string,
    attemptsText: string,
    maximumText: string,
    pinned: string,
    conversionRate: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.reviewer = reviewer;
    this.bid = bid;
    this.priority = priority;
    this.attemptsText = attemptsText;
    this.maximumText = maximumText;
    this.pinned = pinned;
    this.conversionRate = conversionRate;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toCsatSummaryView(item: CsatSummary): CsatSummaryView {
  return new CsatSummaryView(
    item.code,
    item.label,
    item.reviewer,
    item.bid.toFixed(2),
    String(item.priority),
    String(item.attempts),
    item.maximum.toFixed(2),
    `${item.pinned}`,
    item.conversionRate.toFixed(2),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatSummaryViews(items: CsatSummary[]): CsatSummaryView[] {
  const views: CsatSummaryView[] = [];
  for (const item of items) {
    views.push(toCsatSummaryView(item));
  }
  return views;
}

export function sumCsatSummaryView(view: CsatSummaryView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  return parsedBid + parsedPriority + parsedAttempts;
}
