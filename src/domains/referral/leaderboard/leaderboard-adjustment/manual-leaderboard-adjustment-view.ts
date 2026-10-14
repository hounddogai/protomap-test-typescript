import * as text from "../../../../kit/text.js";
import { ManualLeaderboardAdjustment } from "./manual-leaderboard-adjustment.js";

/** How screens and exports show a manual leaderboard adjustment. */
export class ManualLeaderboardAdjustmentView {
  code: string;
  titleText: string;
  pinnedText: string;
  capacity: string;
  currencyText: string;
  amountText: string;
  locale: string;
  budget: string;
  ceilingText: string;
  externalRefText: string;
  countryText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    pinnedText: string,
    capacity: string,
    currencyText: string,
    amountText: string,
    locale: string,
    budget: string,
    ceilingText: string,
    externalRefText: string,
    countryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.pinnedText = pinnedText;
    this.capacity = capacity;
    this.currencyText = currencyText;
    this.amountText = amountText;
    this.locale = locale;
    this.budget = budget;
    this.ceilingText = ceilingText;
    this.externalRefText = externalRefText;
    this.countryText = countryText;
    this.statusLabel = statusLabel;
  }
}

export function toManualLeaderboardAdjustmentView(item: ManualLeaderboardAdjustment): ManualLeaderboardAdjustmentView {
  return new ManualLeaderboardAdjustmentView(
    text.truncate(item.code, 120),
    item.title,
    `${item.pinned}`,
    String(item.capacity),
    item.currency,
    item.amount.toFixed(2),
    text.truncate(item.locale, 64),
    item.budget.toFixed(2),
    item.ceiling.toFixed(2),
    item.externalRef,
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualLeaderboardAdjustmentViews(items: ManualLeaderboardAdjustment[]): ManualLeaderboardAdjustmentView[] {
  const views: ManualLeaderboardAdjustmentView[] = [];
  for (const item of items) {
    views.push(toManualLeaderboardAdjustmentView(item));
  }
  return views;
}

export function sumManualLeaderboardAdjustmentView(view: ManualLeaderboardAdjustmentView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedCapacity + parsedAmount + parsedBudget;
}
