import { GlobalInsightGroup } from "./global-insight-group.js";

/** How screens and exports show a global insight group. */
export class GlobalInsightGroupView {
  code: string;
  label: string;
  threshold: string;
  attempts: string;
  margin: string;
  budgetText: string;
  graceDays: string;
  impressionsText: string;
  quantityText: string;
  clicks: string;
  category: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    threshold: string,
    attempts: string,
    margin: string,
    budgetText: string,
    graceDays: string,
    impressionsText: string,
    quantityText: string,
    clicks: string,
    category: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.attempts = attempts;
    this.margin = margin;
    this.budgetText = budgetText;
    this.graceDays = graceDays;
    this.impressionsText = impressionsText;
    this.quantityText = quantityText;
    this.clicks = clicks;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalInsightGroupView(item: GlobalInsightGroup): GlobalInsightGroupView {
  return new GlobalInsightGroupView(
    item.code,
    item.label,
    item.threshold.toFixed(2),
    String(item.attempts),
    item.margin.toFixed(2),
    item.budget.toFixed(2),
    String(item.graceDays),
    String(item.impressions),
    String(item.quantity),
    String(item.clicks),
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalInsightGroupViews(items: GlobalInsightGroup[]): GlobalInsightGroupView[] {
  const views: GlobalInsightGroupView[] = [];
  for (const item of items) {
    views.push(toGlobalInsightGroupView(item));
  }
  return views;
}

export function sumGlobalInsightGroupView(view: GlobalInsightGroupView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedThreshold + parsedAttempts + parsedMargin;
}
