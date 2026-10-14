import * as text from "../../../../kit/text.js";
import { RewardRulePolicy } from "./reward-rule-policy.js";

/** How screens and exports show a reward rule policy. */
export class RewardRulePolicyView {
  codeText: string;
  labelText: string;
  floorValueText: string;
  thresholdText: string;
  updatedAtText: string;
  name: string;
  journeyId: string;
  variant: string;
  approvedText: string;
  retriesText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    floorValueText: string,
    thresholdText: string,
    updatedAtText: string,
    name: string,
    journeyId: string,
    variant: string,
    approvedText: string,
    retriesText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.floorValueText = floorValueText;
    this.thresholdText = thresholdText;
    this.updatedAtText = updatedAtText;
    this.name = name;
    this.journeyId = journeyId;
    this.variant = variant;
    this.approvedText = approvedText;
    this.retriesText = retriesText;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRulePolicyView(item: RewardRulePolicy): RewardRulePolicyView {
  return new RewardRulePolicyView(
    item.code,
    item.label,
    item.floorValue.toFixed(2),
    item.threshold.toFixed(2),
    String(item.updatedAt),
    item.name,
    text.truncate(item.journeyId, 64),
    text.truncate(item.variant, 40),
    `${item.approved}`,
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRulePolicyViews(items: RewardRulePolicy[]): RewardRulePolicyView[] {
  const views: RewardRulePolicyView[] = [];
  for (const item of items) {
    views.push(toRewardRulePolicyView(item));
  }
  return views;
}

export function sumRewardRulePolicyView(view: RewardRulePolicyView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedFloorValue + parsedThreshold + parsedUpdatedAt;
}
