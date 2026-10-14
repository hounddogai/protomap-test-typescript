import * as text from "../../../../kit/text.js";
import { ModelManifest } from "./model-manifest.js";

/** How screens and exports show a model manifest. */
export class ModelManifestView {
  codeText: string;
  label: string;
  active: string;
  budget: string;
  conversionRate: string;
  description: string;
  channel: string;
  locale: string;
  cost: string;
  windowDaysText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    active: string,
    budget: string,
    conversionRate: string,
    description: string,
    channel: string,
    locale: string,
    cost: string,
    windowDaysText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.active = active;
    this.budget = budget;
    this.conversionRate = conversionRate;
    this.description = description;
    this.channel = channel;
    this.locale = locale;
    this.cost = cost;
    this.windowDaysText = windowDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toModelManifestView(item: ModelManifest): ModelManifestView {
  return new ModelManifestView(
    item.code,
    item.label,
    `${item.active}`,
    item.budget.toFixed(2),
    item.conversionRate.toFixed(2),
    item.description,
    item.channel,
    text.truncate(item.locale, 80),
    item.cost.toFixed(2),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toModelManifestViews(items: ModelManifest[]): ModelManifestView[] {
  const views: ModelManifestView[] = [];
  for (const item of items) {
    views.push(toModelManifestView(item));
  }
  return views;
}

export function sumModelManifestView(view: ModelManifestView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedBudget + parsedConversionRate + parsedCost;
}
