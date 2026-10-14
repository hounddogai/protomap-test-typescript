import * as text from "../../../../kit/text.js";
import { TieredLevelPreference } from "./tiered-level-preference.js";

/** How screens and exports show a tiered level preference. */
export class TieredLevelPreferenceView {
  code: string;
  label: string;
  campaignRef: string;
  budget: string;
  category: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    budget: string,
    category: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.budget = budget;
    this.category = category;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toTieredLevelPreferenceView(item: TieredLevelPreference): TieredLevelPreferenceView {
  return new TieredLevelPreferenceView(
    item.code,
    item.label,
    text.truncate(item.campaignRef, 80),
    item.budget.toFixed(2),
    item.category,
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredLevelPreferenceViews(items: TieredLevelPreference[]): TieredLevelPreferenceView[] {
  const views: TieredLevelPreferenceView[] = [];
  for (const item of items) {
    views.push(toTieredLevelPreferenceView(item));
  }
  return views;
}

export function sumTieredLevelPreferenceView(view: TieredLevelPreferenceView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedBudget + parsedBatchSize;
}
