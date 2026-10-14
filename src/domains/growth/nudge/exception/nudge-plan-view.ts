import { NudgePlan } from "./nudge-plan.js";

/** How screens and exports show a nudge plan. */
export class NudgePlanView {
  code: string;
  labelText: string;
  visible: string;
  openRate: string;
  attempts: string;
  externalRefText: string;
  amountText: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    visible: string,
    openRate: string,
    attempts: string,
    externalRefText: string,
    amountText: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.visible = visible;
    this.openRate = openRate;
    this.attempts = attempts;
    this.externalRefText = externalRefText;
    this.amountText = amountText;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toNudgePlanView(item: NudgePlan): NudgePlanView {
  return new NudgePlanView(
    item.code,
    item.label,
    `${item.visible}`,
    item.openRate.toFixed(2),
    String(item.attempts),
    item.externalRef,
    item.amount.toFixed(2),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toNudgePlanViews(items: NudgePlan[]): NudgePlanView[] {
  const views: NudgePlanView[] = [];
  for (const item of items) {
    views.push(toNudgePlanView(item));
  }
  return views;
}

export function sumNudgePlanView(view: NudgePlanView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedOpenRate + parsedAttempts + parsedAmount;
}
