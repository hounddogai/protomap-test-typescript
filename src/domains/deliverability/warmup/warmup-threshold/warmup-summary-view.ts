import * as text from "../../../../kit/text.js";
import { WarmupSummary } from "./warmup-summary.js";

/** How screens and exports show a warmup summary. */
export class WarmupSummaryView {
  code: string;
  title: string;
  labelText: string;
  priority: string;
  attemptsText: string;
  updatedAt: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    labelText: string,
    priority: string,
    attemptsText: string,
    updatedAt: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.labelText = labelText;
    this.priority = priority;
    this.attemptsText = attemptsText;
    this.updatedAt = updatedAt;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toWarmupSummaryView(item: WarmupSummary): WarmupSummaryView {
  return new WarmupSummaryView(
    item.code,
    text.truncate(item.title, 120),
    text.truncate(item.label, 64),
    String(item.priority),
    String(item.attempts),
    String(item.updatedAt),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWarmupSummaryViews(items: WarmupSummary[]): WarmupSummaryView[] {
  const views: WarmupSummaryView[] = [];
  for (const item of items) {
    views.push(toWarmupSummaryView(item));
  }
  return views;
}

export function sumWarmupSummaryView(view: WarmupSummaryView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedPriority + parsedAttempts + parsedUpdatedAt;
}
