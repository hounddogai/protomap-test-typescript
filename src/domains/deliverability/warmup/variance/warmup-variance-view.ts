import * as text from "../../../../kit/text.js";
import { WarmupVariance } from "./warmup-variance.js";

/** How screens and exports show a warmup variance. */
export class WarmupVarianceView {
  code: string;
  name: string;
  archived: string;
  weightText: string;
  category: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    archived: string,
    weightText: string,
    category: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.weightText = weightText;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toWarmupVarianceView(item: WarmupVariance): WarmupVarianceView {
  return new WarmupVarianceView(
    item.code,
    text.truncate(item.name, 64),
    `${item.archived}`,
    item.weight.toFixed(2),
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toWarmupVarianceViews(items: WarmupVariance[]): WarmupVarianceView[] {
  const views: WarmupVarianceView[] = [];
  for (const item of items) {
    views.push(toWarmupVarianceView(item));
  }
  return views;
}

export function sumWarmupVarianceView(view: WarmupVarianceView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedWeight;
}
