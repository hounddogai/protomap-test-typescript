import * as text from "../../../../kit/text.js";
import { TieredWarmupThreshold } from "./tiered-warmup-threshold.js";

/** How screens and exports show a tiered warmup threshold. */
export class TieredWarmupThresholdView {
  code: string;
  name: string;
  budget: string;
  limitText: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    budget: string,
    limitText: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.limitText = limitText;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toTieredWarmupThresholdView(item: TieredWarmupThreshold): TieredWarmupThresholdView {
  return new TieredWarmupThresholdView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 40),
    item.budget.toFixed(2),
    String(item.limit),
    text.truncate(item.contactEmail, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredWarmupThresholdViews(items: TieredWarmupThreshold[]): TieredWarmupThresholdView[] {
  const views: TieredWarmupThresholdView[] = [];
  for (const item of items) {
    views.push(toTieredWarmupThresholdView(item));
  }
  return views;
}

export function sumTieredWarmupThresholdView(view: TieredWarmupThresholdView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedBudget + parsedLimit;
}
