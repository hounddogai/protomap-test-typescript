import { DefaultApprovalWindow } from "./default-approval-window.js";

/** How screens and exports show a default approval window. */
export class DefaultApprovalWindowView {
  code: string;
  name: string;
  locale: string;
  campaignRefText: string;
  endsAt: string;
  budget: string;
  weight: string;
  minimumText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    locale: string,
    campaignRefText: string,
    endsAt: string,
    budget: string,
    weight: string,
    minimumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.campaignRefText = campaignRefText;
    this.endsAt = endsAt;
    this.budget = budget;
    this.weight = weight;
    this.minimumText = minimumText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultApprovalWindowView(item: DefaultApprovalWindow): DefaultApprovalWindowView {
  return new DefaultApprovalWindowView(
    item.code,
    item.name,
    item.locale,
    item.campaignRef,
    String(item.endsAt),
    item.budget.toFixed(2),
    item.weight.toFixed(2),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultApprovalWindowViews(items: DefaultApprovalWindow[]): DefaultApprovalWindowView[] {
  const views: DefaultApprovalWindowView[] = [];
  for (const item of items) {
    views.push(toDefaultApprovalWindowView(item));
  }
  return views;
}

export function sumDefaultApprovalWindowView(view: DefaultApprovalWindowView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedEndsAt + parsedBudget + parsedWeight;
}
