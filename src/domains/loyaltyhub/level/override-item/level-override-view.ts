import { LevelOverride } from "./level-override.js";

/** How screens and exports show a level override. */
export class LevelOverrideView {
  code: string;
  title: string;
  reviewerText: string;
  costText: string;
  weight: string;
  updatedAt: string;
  durationMinutes: string;
  locale: string;
  createdAtText: string;
  minimumText: string;
  ratio: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    reviewerText: string,
    costText: string,
    weight: string,
    updatedAt: string,
    durationMinutes: string,
    locale: string,
    createdAtText: string,
    minimumText: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.reviewerText = reviewerText;
    this.costText = costText;
    this.weight = weight;
    this.updatedAt = updatedAt;
    this.durationMinutes = durationMinutes;
    this.locale = locale;
    this.createdAtText = createdAtText;
    this.minimumText = minimumText;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toLevelOverrideView(item: LevelOverride): LevelOverrideView {
  return new LevelOverrideView(
    item.code,
    item.title,
    item.reviewer,
    item.cost.toFixed(2),
    item.weight.toFixed(2),
    String(item.updatedAt),
    String(item.durationMinutes),
    item.locale,
    String(item.createdAt),
    item.minimum.toFixed(2),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLevelOverrideViews(items: LevelOverride[]): LevelOverrideView[] {
  const views: LevelOverrideView[] = [];
  for (const item of items) {
    views.push(toLevelOverrideView(item));
  }
  return views;
}

export function sumLevelOverrideView(view: LevelOverrideView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedCost + parsedWeight + parsedUpdatedAt;
}
