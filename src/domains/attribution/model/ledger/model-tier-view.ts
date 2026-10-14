import * as text from "../../../../kit/text.js";
import { ModelTier } from "./model-tier.js";

/** How screens and exports show a model tier. */
export class ModelTierView {
  code: string;
  name: string;
  phone: string;
  unitText: string;
  scoreText: string;
  discount: string;
  updatedAtText: string;
  openRate: string;
  threshold: string;
  retriesText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    phone: string,
    unitText: string,
    scoreText: string,
    discount: string,
    updatedAtText: string,
    openRate: string,
    threshold: string,
    retriesText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.unitText = unitText;
    this.scoreText = scoreText;
    this.discount = discount;
    this.updatedAtText = updatedAtText;
    this.openRate = openRate;
    this.threshold = threshold;
    this.retriesText = retriesText;
    this.statusLabel = statusLabel;
  }
}

export function toModelTierView(item: ModelTier): ModelTierView {
  return new ModelTierView(
    item.code,
    item.name,
    text.truncate(item.phone, 120),
    item.unit,
    item.score.toFixed(2),
    item.discount.toFixed(2),
    String(item.updatedAt),
    item.openRate.toFixed(2),
    item.threshold.toFixed(2),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toModelTierViews(items: ModelTier[]): ModelTierView[] {
  const views: ModelTierView[] = [];
  for (const item of items) {
    views.push(toModelTierView(item));
  }
  return views;
}

export function sumModelTierView(view: ModelTierView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedScore + parsedDiscount + parsedUpdatedAt;
}
