import * as text from "../../../../kit/text.js";
import { StreakLedger } from "./streak-ledger.js";

/** How screens and exports show a streak ledger. */
export class StreakLedgerView {
  codeText: string;
  title: string;
  cohort: string;
  utmSource: string;
  weight: string;
  reviewerText: string;
  endsAt: string;
  summary: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    cohort: string,
    utmSource: string,
    weight: string,
    reviewerText: string,
    endsAt: string,
    summary: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.cohort = cohort;
    this.utmSource = utmSource;
    this.weight = weight;
    this.reviewerText = reviewerText;
    this.endsAt = endsAt;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toStreakLedgerView(item: StreakLedger): StreakLedgerView {
  return new StreakLedgerView(
    text.truncate(item.code, 40),
    item.title,
    item.cohort,
    text.truncate(item.utmSource, 120),
    item.weight.toFixed(2),
    text.truncate(item.reviewer, 64),
    String(item.endsAt),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toStreakLedgerViews(items: StreakLedger[]): StreakLedgerView[] {
  const views: StreakLedgerView[] = [];
  for (const item of items) {
    views.push(toStreakLedgerView(item));
  }
  return views;
}

export function sumStreakLedgerView(view: StreakLedgerView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedWeight + parsedEndsAt;
}
