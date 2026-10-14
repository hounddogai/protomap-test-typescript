import { AdaptiveRewardRuleTarget } from "./adaptive-reward-rule-target.js";

/** How screens and exports show a adaptive reward rule target. */
export class AdaptiveRewardRuleTargetView {
  code: string;
  title: string;
  priority: string;
  channelText: string;
  labelText: string;
  unit: string;
  impressions: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    priority: string,
    channelText: string,
    labelText: string,
    unit: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.channelText = channelText;
    this.labelText = labelText;
    this.unit = unit;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveRewardRuleTargetView(item: AdaptiveRewardRuleTarget): AdaptiveRewardRuleTargetView {
  return new AdaptiveRewardRuleTargetView(
    item.code,
    item.title,
    String(item.priority),
    item.channel,
    item.label,
    item.unit,
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveRewardRuleTargetViews(items: AdaptiveRewardRuleTarget[]): AdaptiveRewardRuleTargetView[] {
  const views: AdaptiveRewardRuleTargetView[] = [];
  for (const item of items) {
    views.push(toAdaptiveRewardRuleTargetView(item));
  }
  return views;
}

export function sumAdaptiveRewardRuleTargetView(view: AdaptiveRewardRuleTargetView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedPriority + parsedImpressions;
}
