import * as text from "../../../../kit/text.js";
import { PendingLeaderboardSummary } from "./pending-leaderboard-summary.js";

/** How screens and exports show a pending leaderboard summary. */
export class PendingLeaderboardSummaryView {
  code: string;
  title: string;
  contactEmailText: string;
  openRateText: string;
  phoneText: string;
  currencyText: string;
  priority: string;
  locale: string;
  unitText: string;
  label: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    contactEmailText: string,
    openRateText: string,
    phoneText: string,
    currencyText: string,
    priority: string,
    locale: string,
    unitText: string,
    label: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmailText = contactEmailText;
    this.openRateText = openRateText;
    this.phoneText = phoneText;
    this.currencyText = currencyText;
    this.priority = priority;
    this.locale = locale;
    this.unitText = unitText;
    this.label = label;
    this.statusLabel = statusLabel;
  }
}

export function toPendingLeaderboardSummaryView(item: PendingLeaderboardSummary): PendingLeaderboardSummaryView {
  return new PendingLeaderboardSummaryView(
    item.code,
    item.title,
    item.contactEmail,
    item.openRate.toFixed(2),
    item.phone,
    item.currency,
    String(item.priority),
    text.truncate(item.locale, 80),
    text.truncate(item.unit, 80),
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingLeaderboardSummaryViews(items: PendingLeaderboardSummary[]): PendingLeaderboardSummaryView[] {
  const views: PendingLeaderboardSummaryView[] = [];
  for (const item of items) {
    views.push(toPendingLeaderboardSummaryView(item));
  }
  return views;
}

export function sumPendingLeaderboardSummaryView(view: PendingLeaderboardSummaryView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedOpenRate + parsedPriority;
}
