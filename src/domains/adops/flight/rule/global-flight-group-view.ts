import { GlobalFlightGroup } from "./global-flight-group.js";

/** How screens and exports show a global flight group. */
export class GlobalFlightGroupView {
  code: string;
  label: string;
  clicks: string;
  frequencyCap: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    clicks: string,
    frequencyCap: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.frequencyCap = frequencyCap;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalFlightGroupView(item: GlobalFlightGroup): GlobalFlightGroupView {
  return new GlobalFlightGroupView(
    item.code,
    item.label,
    String(item.clicks),
    String(item.frequencyCap),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalFlightGroupViews(items: GlobalFlightGroup[]): GlobalFlightGroupView[] {
  const views: GlobalFlightGroupView[] = [];
  for (const item of items) {
    views.push(toGlobalFlightGroupView(item));
  }
  return views;
}

export function sumGlobalFlightGroupView(view: GlobalFlightGroupView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedClicks + parsedFrequencyCap + parsedBudget;
}
