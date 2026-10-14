import { WindowPlan } from "./window-plan.js";

/** How screens and exports show a window plan. */
export class WindowPlanView {
  codeText: string;
  label: string;
  graceDaysText: string;
  attempts: string;
  openRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    graceDaysText: string,
    attempts: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.graceDaysText = graceDaysText;
    this.attempts = attempts;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toWindowPlanView(item: WindowPlan): WindowPlanView {
  return new WindowPlanView(
    item.code,
    item.label,
    String(item.graceDays),
    String(item.attempts),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowPlanViews(items: WindowPlan[]): WindowPlanView[] {
  const views: WindowPlanView[] = [];
  for (const item of items) {
    views.push(toWindowPlanView(item));
  }
  return views;
}

export function sumWindowPlanView(view: WindowPlanView): number {
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedGraceDays + parsedAttempts + parsedOpenRate;
}
