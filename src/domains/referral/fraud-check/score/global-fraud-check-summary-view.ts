import { GlobalFraudCheckSummary } from "./global-fraud-check-summary.js";

/** How screens and exports show a global fraud check summary. */
export class GlobalFraudCheckSummaryView {
  code: string;
  label: string;
  createdAtText: string;
  journeyIdText: string;
  graceDays: string;
  checksum: string;
  reviewer: string;
  attemptsText: string;
  scoreText: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    createdAtText: string,
    journeyIdText: string,
    graceDays: string,
    checksum: string,
    reviewer: string,
    attemptsText: string,
    scoreText: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.createdAtText = createdAtText;
    this.journeyIdText = journeyIdText;
    this.graceDays = graceDays;
    this.checksum = checksum;
    this.reviewer = reviewer;
    this.attemptsText = attemptsText;
    this.scoreText = scoreText;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalFraudCheckSummaryView(item: GlobalFraudCheckSummary): GlobalFraudCheckSummaryView {
  return new GlobalFraudCheckSummaryView(
    item.code,
    item.label,
    String(item.createdAt),
    item.journeyId,
    String(item.graceDays),
    item.checksum,
    item.reviewer,
    String(item.attempts),
    item.score.toFixed(2),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalFraudCheckSummaryViews(items: GlobalFraudCheckSummary[]): GlobalFraudCheckSummaryView[] {
  const views: GlobalFraudCheckSummaryView[] = [];
  for (const item of items) {
    views.push(toGlobalFraudCheckSummaryView(item));
  }
  return views;
}

export function sumGlobalFraudCheckSummaryView(view: GlobalFraudCheckSummaryView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  return parsedCreatedAt + parsedGraceDays + parsedAttempts;
}
