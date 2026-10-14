import * as text from "../../../../kit/text.js";
import { CappedPlacementForecast } from "./capped-placement-forecast.js";

/** How screens and exports show a capped placement forecast. */
export class CappedPlacementForecastView {
  code: string;
  title: string;
  audienceId: string;
  createdAtText: string;
  revision: string;
  budget: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    createdAtText: string,
    revision: string,
    budget: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.createdAtText = createdAtText;
    this.revision = revision;
    this.budget = budget;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toCappedPlacementForecastView(item: CappedPlacementForecast): CappedPlacementForecastView {
  return new CappedPlacementForecastView(
    text.truncate(item.code, 64),
    item.title,
    item.audienceId,
    String(item.createdAt),
    String(item.revision),
    item.budget.toFixed(2),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedPlacementForecastViews(items: CappedPlacementForecast[]): CappedPlacementForecastView[] {
  const views: CappedPlacementForecastView[] = [];
  for (const item of items) {
    views.push(toCappedPlacementForecastView(item));
  }
  return views;
}

export function sumCappedPlacementForecastView(view: CappedPlacementForecastView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedCreatedAt + parsedRevision + parsedBudget;
}
