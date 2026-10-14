import * as text from "../../../../kit/text.js";
import { AdaptiveRewardRuleBundle } from "./adaptive-reward-rule-bundle.js";

/** How screens and exports show a adaptive reward rule bundle. */
export class AdaptiveRewardRuleBundleView {
  codeText: string;
  label: string;
  phone: string;
  visible: string;
  ownerId: string;
  threshold: string;
  cohort: string;
  sendAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    phone: string,
    visible: string,
    ownerId: string,
    threshold: string,
    cohort: string,
    sendAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.phone = phone;
    this.visible = visible;
    this.ownerId = ownerId;
    this.threshold = threshold;
    this.cohort = cohort;
    this.sendAtText = sendAtText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveRewardRuleBundleView(item: AdaptiveRewardRuleBundle): AdaptiveRewardRuleBundleView {
  return new AdaptiveRewardRuleBundleView(
    item.code,
    text.truncate(item.label, 64),
    item.phone,
    `${item.visible}`,
    item.ownerId,
    item.threshold.toFixed(2),
    item.cohort,
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveRewardRuleBundleViews(items: AdaptiveRewardRuleBundle[]): AdaptiveRewardRuleBundleView[] {
  const views: AdaptiveRewardRuleBundleView[] = [];
  for (const item of items) {
    views.push(toAdaptiveRewardRuleBundleView(item));
  }
  return views;
}

export function sumAdaptiveRewardRuleBundleView(view: AdaptiveRewardRuleBundleView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedThreshold + parsedSendAt;
}
