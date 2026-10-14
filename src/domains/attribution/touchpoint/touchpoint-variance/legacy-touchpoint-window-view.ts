import { LegacyTouchpointWindow } from "./legacy-touchpoint-window.js";

/** How screens and exports show a legacy touchpoint window. */
export class LegacyTouchpointWindowView {
  code: string;
  name: string;
  visible: string;
  openRate: string;
  budget: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    visible: string,
    openRate: string,
    budget: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.openRate = openRate;
    this.budget = budget;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyTouchpointWindowView(item: LegacyTouchpointWindow): LegacyTouchpointWindowView {
  return new LegacyTouchpointWindowView(
    item.code,
    item.name,
    `${item.visible}`,
    item.openRate.toFixed(2),
    item.budget.toFixed(2),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyTouchpointWindowViews(items: LegacyTouchpointWindow[]): LegacyTouchpointWindowView[] {
  const views: LegacyTouchpointWindowView[] = [];
  for (const item of items) {
    views.push(toLegacyTouchpointWindowView(item));
  }
  return views;
}

export function sumLegacyTouchpointWindowView(view: LegacyTouchpointWindowView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedOpenRate + parsedBudget + parsedMargin;
}
