import * as text from "../../../../kit/text.js";
import { SeasonalSlaVariance } from "./seasonal-sla-variance.js";

/** How screens and exports show a seasonal sla variance. */
export class SeasonalSlaVarianceView {
  code: string;
  name: string;
  budget: string;
  channel: string;
  timezone: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    budget: string,
    channel: string,
    timezone: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.channel = channel;
    this.timezone = timezone;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalSlaVarianceView(item: SeasonalSlaVariance): SeasonalSlaVarianceView {
  return new SeasonalSlaVarianceView(
    text.truncate(item.code, 40),
    item.name,
    item.budget.toFixed(2),
    item.channel,
    text.truncate(item.timezone, 80),
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalSlaVarianceViews(items: SeasonalSlaVariance[]): SeasonalSlaVarianceView[] {
  const views: SeasonalSlaVarianceView[] = [];
  for (const item of items) {
    views.push(toSeasonalSlaVarianceView(item));
  }
  return views;
}

export function sumSeasonalSlaVarianceView(view: SeasonalSlaVarianceView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedBudget + parsedUpdatedAt;
}
