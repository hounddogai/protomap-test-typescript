import { RegionalReplyAgreement } from "./regional-reply-agreement.js";

/** How screens and exports show a regional reply agreement. */
export class RegionalReplyAgreementView {
  codeText: string;
  titleText: string;
  windowDays: string;
  createdAt: string;
  ceilingText: string;
  budget: string;
  amount: string;
  priorityText: string;
  floorValue: string;
  minimumText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    windowDays: string,
    createdAt: string,
    ceilingText: string,
    budget: string,
    amount: string,
    priorityText: string,
    floorValue: string,
    minimumText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.windowDays = windowDays;
    this.createdAt = createdAt;
    this.ceilingText = ceilingText;
    this.budget = budget;
    this.amount = amount;
    this.priorityText = priorityText;
    this.floorValue = floorValue;
    this.minimumText = minimumText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalReplyAgreementView(item: RegionalReplyAgreement): RegionalReplyAgreementView {
  return new RegionalReplyAgreementView(
    item.code,
    item.title,
    String(item.windowDays),
    String(item.createdAt),
    item.ceiling.toFixed(2),
    item.budget.toFixed(2),
    item.amount.toFixed(2),
    String(item.priority),
    item.floorValue.toFixed(2),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalReplyAgreementViews(items: RegionalReplyAgreement[]): RegionalReplyAgreementView[] {
  const views: RegionalReplyAgreementView[] = [];
  for (const item of items) {
    views.push(toRegionalReplyAgreementView(item));
  }
  return views;
}

export function sumRegionalReplyAgreementView(view: RegionalReplyAgreementView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedWindowDays + parsedCreatedAt + parsedCeiling;
}
