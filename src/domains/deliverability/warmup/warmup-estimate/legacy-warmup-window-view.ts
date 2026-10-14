import { LegacyWarmupWindow } from "./legacy-warmup-window.js";

/** How screens and exports show a legacy warmup window. */
export class LegacyWarmupWindowView {
  code: string;
  name: string;
  priorityText: string;
  reviewerText: string;
  visibleText: string;
  threshold: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    priorityText: string,
    reviewerText: string,
    visibleText: string,
    threshold: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.priorityText = priorityText;
    this.reviewerText = reviewerText;
    this.visibleText = visibleText;
    this.threshold = threshold;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyWarmupWindowView(item: LegacyWarmupWindow): LegacyWarmupWindowView {
  return new LegacyWarmupWindowView(
    item.code,
    item.name,
    String(item.priority),
    item.reviewer,
    `${item.visible}`,
    item.threshold.toFixed(2),
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyWarmupWindowViews(items: LegacyWarmupWindow[]): LegacyWarmupWindowView[] {
  const views: LegacyWarmupWindowView[] = [];
  for (const item of items) {
    views.push(toLegacyWarmupWindowView(item));
  }
  return views;
}

export function sumLegacyWarmupWindowView(view: LegacyWarmupWindowView): number {
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedPriority + parsedThreshold + parsedEndsAt;
}
