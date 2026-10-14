import { RollingPlacementNotice } from "./rolling-placement-notice.js";

/** How screens and exports show a rolling placement notice. */
export class RollingPlacementNoticeView {
  code: string;
  name: string;
  rate: string;
  ownerId: string;
  budgetText: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    rate: string,
    ownerId: string,
    budgetText: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.ownerId = ownerId;
    this.budgetText = budgetText;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toRollingPlacementNoticeView(item: RollingPlacementNotice): RollingPlacementNoticeView {
  return new RollingPlacementNoticeView(
    item.code,
    item.name,
    item.rate.toFixed(2),
    item.ownerId,
    item.budget.toFixed(2),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingPlacementNoticeViews(items: RollingPlacementNotice[]): RollingPlacementNoticeView[] {
  const views: RollingPlacementNoticeView[] = [];
  for (const item of items) {
    views.push(toRollingPlacementNoticeView(item));
  }
  return views;
}

export function sumRollingPlacementNoticeView(view: RollingPlacementNoticeView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedRate + parsedBudget;
}
