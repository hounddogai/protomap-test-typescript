import * as text from "../../../../kit/text.js";
import { SeasonalNudgeWindow } from "./seasonal-nudge-window.js";

/** How screens and exports show a seasonal nudge window. */
export class SeasonalNudgeWindowView {
  code: string;
  title: string;
  ratioText: string;
  graceDays: string;
  phone: string;
  budgetText: string;
  regionText: string;
  approved: string;
  retries: string;
  campaignRef: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    ratioText: string,
    graceDays: string,
    phone: string,
    budgetText: string,
    regionText: string,
    approved: string,
    retries: string,
    campaignRef: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.ratioText = ratioText;
    this.graceDays = graceDays;
    this.phone = phone;
    this.budgetText = budgetText;
    this.regionText = regionText;
    this.approved = approved;
    this.retries = retries;
    this.campaignRef = campaignRef;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalNudgeWindowView(item: SeasonalNudgeWindow): SeasonalNudgeWindowView {
  return new SeasonalNudgeWindowView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 64),
    item.ratio.toFixed(2),
    String(item.graceDays),
    item.phone,
    item.budget.toFixed(2),
    item.region,
    `${item.approved}`,
    String(item.retries),
    item.campaignRef,
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalNudgeWindowViews(items: SeasonalNudgeWindow[]): SeasonalNudgeWindowView[] {
  const views: SeasonalNudgeWindowView[] = [];
  for (const item of items) {
    views.push(toSeasonalNudgeWindowView(item));
  }
  return views;
}

export function sumSeasonalNudgeWindowView(view: SeasonalNudgeWindowView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedRatio + parsedGraceDays + parsedBudget;
}
