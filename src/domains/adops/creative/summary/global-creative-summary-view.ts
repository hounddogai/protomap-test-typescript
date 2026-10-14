import { GlobalCreativeSummary } from "./global-creative-summary.js";

/** How screens and exports show a global creative summary. */
export class GlobalCreativeSummaryView {
  codeText: string;
  label: string;
  cost: string;
  startsAt: string;
  durationMinutes: string;
  reviewer: string;
  budget: string;
  regionText: string;
  discount: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    cost: string,
    startsAt: string,
    durationMinutes: string,
    reviewer: string,
    budget: string,
    regionText: string,
    discount: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.cost = cost;
    this.startsAt = startsAt;
    this.durationMinutes = durationMinutes;
    this.reviewer = reviewer;
    this.budget = budget;
    this.regionText = regionText;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalCreativeSummaryView(item: GlobalCreativeSummary): GlobalCreativeSummaryView {
  return new GlobalCreativeSummaryView(
    item.code,
    item.label,
    item.cost.toFixed(2),
    String(item.startsAt),
    String(item.durationMinutes),
    item.reviewer,
    item.budget.toFixed(2),
    item.region,
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalCreativeSummaryViews(items: GlobalCreativeSummary[]): GlobalCreativeSummaryView[] {
  const views: GlobalCreativeSummaryView[] = [];
  for (const item of items) {
    views.push(toGlobalCreativeSummaryView(item));
  }
  return views;
}

export function sumGlobalCreativeSummaryView(view: GlobalCreativeSummaryView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedCost + parsedStartsAt + parsedDurationMinutes;
}
