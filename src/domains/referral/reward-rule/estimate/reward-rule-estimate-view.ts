import * as text from "../../../../kit/text.js";
import { RewardRuleEstimate } from "./reward-rule-estimate.js";

/** How screens and exports show a reward rule estimate. */
export class RewardRuleEstimateView {
  codeText: string;
  name: string;
  frequencyCapText: string;
  maximum: string;
  threshold: string;
  visible: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    frequencyCapText: string,
    maximum: string,
    threshold: string,
    visible: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.frequencyCapText = frequencyCapText;
    this.maximum = maximum;
    this.threshold = threshold;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleEstimateView(item: RewardRuleEstimate): RewardRuleEstimateView {
  return new RewardRuleEstimateView(
    item.code,
    text.truncate(item.name, 40),
    String(item.frequencyCap),
    item.maximum.toFixed(2),
    item.threshold.toFixed(2),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleEstimateViews(items: RewardRuleEstimate[]): RewardRuleEstimateView[] {
  const views: RewardRuleEstimateView[] = [];
  for (const item of items) {
    views.push(toRewardRuleEstimateView(item));
  }
  return views;
}

export function sumRewardRuleEstimateView(view: RewardRuleEstimateView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedFrequencyCap + parsedMaximum + parsedThreshold;
}
