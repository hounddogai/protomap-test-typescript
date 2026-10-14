import * as text from "../../../../kit/text.js";
import { AdaptiveReputationSummary } from "./adaptive-reputation-summary.js";

/** How screens and exports show a adaptive reputation summary. */
export class AdaptiveReputationSummaryView {
  code: string;
  title: string;
  locale: string;
  cohort: string;
  channel: string;
  openRateText: string;
  pinnedText: string;
  archivedText: string;
  createdAtText: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    locale: string,
    cohort: string,
    channel: string,
    openRateText: string,
    pinnedText: string,
    archivedText: string,
    createdAtText: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.cohort = cohort;
    this.channel = channel;
    this.openRateText = openRateText;
    this.pinnedText = pinnedText;
    this.archivedText = archivedText;
    this.createdAtText = createdAtText;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveReputationSummaryView(item: AdaptiveReputationSummary): AdaptiveReputationSummaryView {
  return new AdaptiveReputationSummaryView(
    item.code,
    item.title,
    item.locale,
    item.cohort,
    text.truncate(item.channel, 64),
    item.openRate.toFixed(2),
    `${item.pinned}`,
    `${item.archived}`,
    String(item.createdAt),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveReputationSummaryViews(items: AdaptiveReputationSummary[]): AdaptiveReputationSummaryView[] {
  const views: AdaptiveReputationSummaryView[] = [];
  for (const item of items) {
    views.push(toAdaptiveReputationSummaryView(item));
  }
  return views;
}

export function sumAdaptiveReputationSummaryView(view: AdaptiveReputationSummaryView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedOpenRate + parsedCreatedAt + parsedScore;
}
