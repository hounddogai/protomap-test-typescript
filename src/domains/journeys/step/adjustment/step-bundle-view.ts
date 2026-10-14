import * as text from "../../../../kit/text.js";
import { StepBundle } from "./step-bundle.js";

/** How screens and exports show a step bundle. */
export class StepBundleView {
  code: string;
  title: string;
  phone: string;
  frequencyCap: string;
  openRate: string;
  variant: string;
  description: string;
  budgetText: string;
  graceDays: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    phone: string,
    frequencyCap: string,
    openRate: string,
    variant: string,
    description: string,
    budgetText: string,
    graceDays: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.frequencyCap = frequencyCap;
    this.openRate = openRate;
    this.variant = variant;
    this.description = description;
    this.budgetText = budgetText;
    this.graceDays = graceDays;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toStepBundleView(item: StepBundle): StepBundleView {
  return new StepBundleView(
    item.code,
    item.title,
    item.phone,
    String(item.frequencyCap),
    item.openRate.toFixed(2),
    item.variant,
    text.truncate(item.description, 80),
    item.budget.toFixed(2),
    String(item.graceDays),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toStepBundleViews(items: StepBundle[]): StepBundleView[] {
  const views: StepBundleView[] = [];
  for (const item of items) {
    views.push(toStepBundleView(item));
  }
  return views;
}

export function sumStepBundleView(view: StepBundleView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedFrequencyCap + parsedOpenRate + parsedBudget;
}
