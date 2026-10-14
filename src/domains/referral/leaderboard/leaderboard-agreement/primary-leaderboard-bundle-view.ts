import * as text from "../../../../kit/text.js";
import { PrimaryLeaderboardBundle } from "./primary-leaderboard-bundle.js";

/** How screens and exports show a primary leaderboard bundle. */
export class PrimaryLeaderboardBundleView {
  code: string;
  label: string;
  utmSource: string;
  notesText: string;
  budget: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    notesText: string,
    budget: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.notesText = notesText;
    this.budget = budget;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryLeaderboardBundleView(item: PrimaryLeaderboardBundle): PrimaryLeaderboardBundleView {
  return new PrimaryLeaderboardBundleView(
    text.truncate(item.code, 40),
    item.label,
    item.utmSource,
    item.notes,
    item.budget.toFixed(2),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryLeaderboardBundleViews(items: PrimaryLeaderboardBundle[]): PrimaryLeaderboardBundleView[] {
  const views: PrimaryLeaderboardBundleView[] = [];
  for (const item of items) {
    views.push(toPrimaryLeaderboardBundleView(item));
  }
  return views;
}

export function sumPrimaryLeaderboardBundleView(view: PrimaryLeaderboardBundleView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedBudget + parsedBatchSize;
}
