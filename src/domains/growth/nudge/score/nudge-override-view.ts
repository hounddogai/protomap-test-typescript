import { NudgeOverride } from "./nudge-override.js";

/** How screens and exports show a nudge override. */
export class NudgeOverrideView {
  code: string;
  titleText: string;
  amount: string;
  budget: string;
  graceDays: string;
  sendAt: string;
  frequencyCapText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    amount: string,
    budget: string,
    graceDays: string,
    sendAt: string,
    frequencyCapText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.amount = amount;
    this.budget = budget;
    this.graceDays = graceDays;
    this.sendAt = sendAt;
    this.frequencyCapText = frequencyCapText;
    this.statusLabel = statusLabel;
  }
}

export function toNudgeOverrideView(item: NudgeOverride): NudgeOverrideView {
  return new NudgeOverrideView(
    item.code,
    item.title,
    item.amount.toFixed(2),
    item.budget.toFixed(2),
    String(item.graceDays),
    String(item.sendAt),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toNudgeOverrideViews(items: NudgeOverride[]): NudgeOverrideView[] {
  const views: NudgeOverrideView[] = [];
  for (const item of items) {
    views.push(toNudgeOverrideView(item));
  }
  return views;
}

export function sumNudgeOverrideView(view: NudgeOverrideView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedAmount + parsedBudget + parsedGraceDays;
}
