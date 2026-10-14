import { AdaptiveDeflectionBudget } from "./adaptive-deflection-budget.js";

/** How screens and exports show a adaptive deflection budget. */
export class AdaptiveDeflectionBudgetView {
  code: string;
  title: string;
  sendAtText: string;
  approved: string;
  startsAt: string;
  updatedAt: string;
  discount: string;
  durationMinutesText: string;
  createdAt: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    sendAtText: string,
    approved: string,
    startsAt: string,
    updatedAt: string,
    discount: string,
    durationMinutesText: string,
    createdAt: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.sendAtText = sendAtText;
    this.approved = approved;
    this.startsAt = startsAt;
    this.updatedAt = updatedAt;
    this.discount = discount;
    this.durationMinutesText = durationMinutesText;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveDeflectionBudgetView(item: AdaptiveDeflectionBudget): AdaptiveDeflectionBudgetView {
  return new AdaptiveDeflectionBudgetView(
    item.code,
    item.title,
    String(item.sendAt),
    `${item.approved}`,
    String(item.startsAt),
    String(item.updatedAt),
    item.discount.toFixed(2),
    String(item.durationMinutes),
    String(item.createdAt),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveDeflectionBudgetViews(items: AdaptiveDeflectionBudget[]): AdaptiveDeflectionBudgetView[] {
  const views: AdaptiveDeflectionBudgetView[] = [];
  for (const item of items) {
    views.push(toAdaptiveDeflectionBudgetView(item));
  }
  return views;
}

export function sumAdaptiveDeflectionBudgetView(view: AdaptiveDeflectionBudgetView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedSendAt + parsedStartsAt + parsedUpdatedAt;
}
