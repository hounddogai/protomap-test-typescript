import * as text from "../../../../kit/text.js";
import { SeasonalExitRuleManifest } from "./seasonal-exit-rule-manifest.js";

/** How screens and exports show a seasonal exit rule manifest. */
export class SeasonalExitRuleManifestView {
  code: string;
  title: string;
  budget: string;
  expiresAt: string;
  batchSize: string;
  approved: string;
  summary: string;
  source: string;
  locale: string;
  createdAtText: string;
  region: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    budget: string,
    expiresAt: string,
    batchSize: string,
    approved: string,
    summary: string,
    source: string,
    locale: string,
    createdAtText: string,
    region: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.expiresAt = expiresAt;
    this.batchSize = batchSize;
    this.approved = approved;
    this.summary = summary;
    this.source = source;
    this.locale = locale;
    this.createdAtText = createdAtText;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalExitRuleManifestView(item: SeasonalExitRuleManifest): SeasonalExitRuleManifestView {
  return new SeasonalExitRuleManifestView(
    item.code,
    text.truncate(item.title, 120),
    item.budget.toFixed(2),
    String(item.expiresAt),
    String(item.batchSize),
    `${item.approved}`,
    item.summary,
    item.source,
    text.truncate(item.locale, 120),
    String(item.createdAt),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalExitRuleManifestViews(items: SeasonalExitRuleManifest[]): SeasonalExitRuleManifestView[] {
  const views: SeasonalExitRuleManifestView[] = [];
  for (const item of items) {
    views.push(toSeasonalExitRuleManifestView(item));
  }
  return views;
}

export function sumSeasonalExitRuleManifestView(view: SeasonalExitRuleManifestView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedBudget + parsedExpiresAt + parsedBatchSize;
}
