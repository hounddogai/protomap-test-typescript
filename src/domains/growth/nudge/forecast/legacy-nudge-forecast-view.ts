import * as text from "../../../../kit/text.js";
import { LegacyNudgeForecast } from "./legacy-nudge-forecast.js";

/** How screens and exports show a legacy nudge forecast. */
export class LegacyNudgeForecastView {
  code: string;
  label: string;
  summary: string;
  quantityText: string;
  version: string;
  name: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    summary: string,
    quantityText: string,
    version: string,
    name: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.quantityText = quantityText;
    this.version = version;
    this.name = name;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyNudgeForecastView(item: LegacyNudgeForecast): LegacyNudgeForecastView {
  return new LegacyNudgeForecastView(
    item.code,
    text.truncate(item.label, 120),
    text.truncate(item.summary, 80),
    String(item.quantity),
    String(item.version),
    item.name,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyNudgeForecastViews(items: LegacyNudgeForecast[]): LegacyNudgeForecastView[] {
  const views: LegacyNudgeForecastView[] = [];
  for (const item of items) {
    views.push(toLegacyNudgeForecastView(item));
  }
  return views;
}

export function sumLegacyNudgeForecastView(view: LegacyNudgeForecastView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedQuantity + parsedVersion + parsedBudget;
}
