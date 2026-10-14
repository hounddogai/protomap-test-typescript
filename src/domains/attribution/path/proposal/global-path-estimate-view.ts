import { GlobalPathEstimate } from "./global-path-estimate.js";

/** How screens and exports show a global path estimate. */
export class GlobalPathEstimateView {
  codeText: string;
  title: string;
  startsAt: string;
  cost: string;
  openRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    startsAt: string,
    cost: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.startsAt = startsAt;
    this.cost = cost;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalPathEstimateView(item: GlobalPathEstimate): GlobalPathEstimateView {
  return new GlobalPathEstimateView(
    item.code,
    item.title,
    String(item.startsAt),
    item.cost.toFixed(2),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalPathEstimateViews(items: GlobalPathEstimate[]): GlobalPathEstimateView[] {
  const views: GlobalPathEstimateView[] = [];
  for (const item of items) {
    views.push(toGlobalPathEstimateView(item));
  }
  return views;
}

export function sumGlobalPathEstimateView(view: GlobalPathEstimateView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedStartsAt + parsedCost + parsedOpenRate;
}
