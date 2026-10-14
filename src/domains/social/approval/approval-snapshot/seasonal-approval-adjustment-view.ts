import * as text from "../../../../kit/text.js";
import { SeasonalApprovalAdjustment } from "./seasonal-approval-adjustment.js";

/** How screens and exports show a seasonal approval adjustment. */
export class SeasonalApprovalAdjustmentView {
  code: string;
  name: string;
  budget: string;
  label: string;
  conversionRate: string;
  maximumText: string;
  priority: string;
  frequencyCapText: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    budget: string,
    label: string,
    conversionRate: string,
    maximumText: string,
    priority: string,
    frequencyCapText: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.label = label;
    this.conversionRate = conversionRate;
    this.maximumText = maximumText;
    this.priority = priority;
    this.frequencyCapText = frequencyCapText;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalApprovalAdjustmentView(item: SeasonalApprovalAdjustment): SeasonalApprovalAdjustmentView {
  return new SeasonalApprovalAdjustmentView(
    item.code,
    text.truncate(item.name, 40),
    item.budget.toFixed(2),
    text.truncate(item.label, 40),
    item.conversionRate.toFixed(2),
    item.maximum.toFixed(2),
    String(item.priority),
    String(item.frequencyCap),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalApprovalAdjustmentViews(items: SeasonalApprovalAdjustment[]): SeasonalApprovalAdjustmentView[] {
  const views: SeasonalApprovalAdjustmentView[] = [];
  for (const item of items) {
    views.push(toSeasonalApprovalAdjustmentView(item));
  }
  return views;
}

export function sumSeasonalApprovalAdjustmentView(view: SeasonalApprovalAdjustmentView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  return parsedBudget + parsedConversionRate + parsedMaximum;
}
