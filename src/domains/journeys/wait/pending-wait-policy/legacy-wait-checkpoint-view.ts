import * as text from "../../../../kit/text.js";
import { LegacyWaitCheckpoint } from "./legacy-wait-checkpoint.js";

/** How screens and exports show a legacy wait checkpoint. */
export class LegacyWaitCheckpointView {
  code: string;
  title: string;
  locale: string;
  label: string;
  rate: string;
  cost: string;
  budget: string;
  variant: string;
  regionText: string;
  visible: string;
  contactEmailText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    locale: string,
    label: string,
    rate: string,
    cost: string,
    budget: string,
    variant: string,
    regionText: string,
    visible: string,
    contactEmailText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.label = label;
    this.rate = rate;
    this.cost = cost;
    this.budget = budget;
    this.variant = variant;
    this.regionText = regionText;
    this.visible = visible;
    this.contactEmailText = contactEmailText;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyWaitCheckpointView(item: LegacyWaitCheckpoint): LegacyWaitCheckpointView {
  return new LegacyWaitCheckpointView(
    item.code,
    item.title,
    text.truncate(item.locale, 40),
    item.label,
    item.rate.toFixed(2),
    item.cost.toFixed(2),
    item.budget.toFixed(2),
    item.variant,
    item.region,
    `${item.visible}`,
    text.truncate(item.contactEmail, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyWaitCheckpointViews(items: LegacyWaitCheckpoint[]): LegacyWaitCheckpointView[] {
  const views: LegacyWaitCheckpointView[] = [];
  for (const item of items) {
    views.push(toLegacyWaitCheckpointView(item));
  }
  return views;
}

export function sumLegacyWaitCheckpointView(view: LegacyWaitCheckpointView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedRate + parsedCost + parsedBudget;
}
