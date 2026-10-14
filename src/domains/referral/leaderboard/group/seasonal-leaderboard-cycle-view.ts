import { SeasonalLeaderboardCycle } from "./seasonal-leaderboard-cycle.js";

/** How screens and exports show a seasonal leaderboard cycle. */
export class SeasonalLeaderboardCycleView {
  code: string;
  label: string;
  floorValue: string;
  description: string;
  version: string;
  approvedText: string;
  discountText: string;
  category: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    floorValue: string,
    description: string,
    version: string,
    approvedText: string,
    discountText: string,
    category: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.description = description;
    this.version = version;
    this.approvedText = approvedText;
    this.discountText = discountText;
    this.category = category;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalLeaderboardCycleView(item: SeasonalLeaderboardCycle): SeasonalLeaderboardCycleView {
  return new SeasonalLeaderboardCycleView(
    item.code,
    item.label,
    item.floorValue.toFixed(2),
    item.description,
    String(item.version),
    `${item.approved}`,
    item.discount.toFixed(2),
    item.category,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalLeaderboardCycleViews(items: SeasonalLeaderboardCycle[]): SeasonalLeaderboardCycleView[] {
  const views: SeasonalLeaderboardCycleView[] = [];
  for (const item of items) {
    views.push(toSeasonalLeaderboardCycleView(item));
  }
  return views;
}

export function sumSeasonalLeaderboardCycleView(view: SeasonalLeaderboardCycleView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedFloorValue + parsedVersion + parsedDiscount;
}
