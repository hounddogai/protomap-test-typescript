import * as text from "../../../../kit/text.js";
import { PendingRewardRuleAdjustment } from "./pending-reward-rule-adjustment.js";

/** How screens and exports show a pending reward rule adjustment. */
export class PendingRewardRuleAdjustmentView {
  code: string;
  labelText: string;
  weightText: string;
  ratio: string;
  priority: string;
  sourceText: string;
  conversionRateText: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    weightText: string,
    ratio: string,
    priority: string,
    sourceText: string,
    conversionRateText: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.weightText = weightText;
    this.ratio = ratio;
    this.priority = priority;
    this.sourceText = sourceText;
    this.conversionRateText = conversionRateText;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toPendingRewardRuleAdjustmentView(item: PendingRewardRuleAdjustment): PendingRewardRuleAdjustmentView {
  return new PendingRewardRuleAdjustmentView(
    item.code,
    item.label,
    item.weight.toFixed(2),
    item.ratio.toFixed(2),
    String(item.priority),
    text.truncate(item.source, 80),
    item.conversionRate.toFixed(2),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingRewardRuleAdjustmentViews(items: PendingRewardRuleAdjustment[]): PendingRewardRuleAdjustmentView[] {
  const views: PendingRewardRuleAdjustmentView[] = [];
  for (const item of items) {
    views.push(toPendingRewardRuleAdjustmentView(item));
  }
  return views;
}

export function sumPendingRewardRuleAdjustmentView(view: PendingRewardRuleAdjustmentView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedWeight + parsedRatio + parsedPriority;
}
