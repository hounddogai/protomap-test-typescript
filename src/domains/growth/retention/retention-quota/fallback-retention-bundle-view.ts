import * as text from "../../../../kit/text.js";
import { FallbackRetentionBundle } from "./fallback-retention-bundle.js";

/** How screens and exports show a fallback retention bundle. */
export class FallbackRetentionBundleView {
  code: string;
  name: string;
  frequencyCap: string;
  endsAtText: string;
  budget: string;
  createdAtText: string;
  priority: string;
  threshold: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    frequencyCap: string,
    endsAtText: string,
    budget: string,
    createdAtText: string,
    priority: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.endsAtText = endsAtText;
    this.budget = budget;
    this.createdAtText = createdAtText;
    this.priority = priority;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackRetentionBundleView(item: FallbackRetentionBundle): FallbackRetentionBundleView {
  return new FallbackRetentionBundleView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 80),
    String(item.frequencyCap),
    String(item.endsAt),
    item.budget.toFixed(2),
    String(item.createdAt),
    String(item.priority),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackRetentionBundleViews(items: FallbackRetentionBundle[]): FallbackRetentionBundleView[] {
  const views: FallbackRetentionBundleView[] = [];
  for (const item of items) {
    views.push(toFallbackRetentionBundleView(item));
  }
  return views;
}

export function sumFallbackRetentionBundleView(view: FallbackRetentionBundleView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedFrequencyCap + parsedEndsAt + parsedBudget;
}
