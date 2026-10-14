import { SeasonalTouchpointCheckpoint } from "./seasonal-touchpoint-checkpoint.js";

/** How screens and exports show a seasonal touchpoint checkpoint. */
export class SeasonalTouchpointCheckpointView {
  code: string;
  label: string;
  description: string;
  locale: string;
  clicksText: string;
  budget: string;
  ratio: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    description: string,
    locale: string,
    clicksText: string,
    budget: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.locale = locale;
    this.clicksText = clicksText;
    this.budget = budget;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalTouchpointCheckpointView(item: SeasonalTouchpointCheckpoint): SeasonalTouchpointCheckpointView {
  return new SeasonalTouchpointCheckpointView(
    item.code,
    item.label,
    item.description,
    item.locale,
    String(item.clicks),
    item.budget.toFixed(2),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalTouchpointCheckpointViews(items: SeasonalTouchpointCheckpoint[]): SeasonalTouchpointCheckpointView[] {
  const views: SeasonalTouchpointCheckpointView[] = [];
  for (const item of items) {
    views.push(toSeasonalTouchpointCheckpointView(item));
  }
  return views;
}

export function sumSeasonalTouchpointCheckpointView(view: SeasonalTouchpointCheckpointView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedClicks + parsedBudget + parsedRatio;
}
