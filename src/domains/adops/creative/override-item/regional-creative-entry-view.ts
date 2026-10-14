import * as text from "../../../../kit/text.js";
import { RegionalCreativeEntry } from "./regional-creative-entry.js";

/** How screens and exports show a regional creative entry. */
export class RegionalCreativeEntryView {
  codeText: string;
  labelText: string;
  regionText: string;
  utmSource: string;
  score: string;
  limit: string;
  priority: string;
  versionText: string;
  reviewer: string;
  createdAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    regionText: string,
    utmSource: string,
    score: string,
    limit: string,
    priority: string,
    versionText: string,
    reviewer: string,
    createdAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.regionText = regionText;
    this.utmSource = utmSource;
    this.score = score;
    this.limit = limit;
    this.priority = priority;
    this.versionText = versionText;
    this.reviewer = reviewer;
    this.createdAtText = createdAtText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalCreativeEntryView(item: RegionalCreativeEntry): RegionalCreativeEntryView {
  return new RegionalCreativeEntryView(
    item.code,
    text.truncate(item.label, 40),
    item.region,
    item.utmSource,
    item.score.toFixed(2),
    String(item.limit),
    String(item.priority),
    String(item.version),
    item.reviewer,
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalCreativeEntryViews(items: RegionalCreativeEntry[]): RegionalCreativeEntryView[] {
  const views: RegionalCreativeEntryView[] = [];
  for (const item of items) {
    views.push(toRegionalCreativeEntryView(item));
  }
  return views;
}

export function sumRegionalCreativeEntryView(view: RegionalCreativeEntryView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedScore + parsedLimit + parsedPriority;
}
