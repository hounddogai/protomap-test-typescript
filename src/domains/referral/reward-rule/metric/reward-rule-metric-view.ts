import * as text from "../../../../kit/text.js";
import { RewardRuleMetric } from "./reward-rule-metric.js";

/** How screens and exports show a reward rule metric. */
export class RewardRuleMetricView {
  codeText: string;
  titleText: string;
  ownerId: string;
  reviewer: string;
  audienceId: string;
  phoneText: string;
  timezoneText: string;
  segment: string;
  frequencyCapText: string;
  channelText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    ownerId: string,
    reviewer: string,
    audienceId: string,
    phoneText: string,
    timezoneText: string,
    segment: string,
    frequencyCapText: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.ownerId = ownerId;
    this.reviewer = reviewer;
    this.audienceId = audienceId;
    this.phoneText = phoneText;
    this.timezoneText = timezoneText;
    this.segment = segment;
    this.frequencyCapText = frequencyCapText;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleMetricView(item: RewardRuleMetric): RewardRuleMetricView {
  return new RewardRuleMetricView(
    item.code,
    item.title,
    item.ownerId,
    item.reviewer,
    item.audienceId,
    item.phone,
    item.timezone,
    text.truncate(item.segment, 64),
    String(item.frequencyCap),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleMetricViews(items: RewardRuleMetric[]): RewardRuleMetricView[] {
  const views: RewardRuleMetricView[] = [];
  for (const item of items) {
    views.push(toRewardRuleMetricView(item));
  }
  return views;
}

export function sumRewardRuleMetricView(view: RewardRuleMetricView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedFrequencyCap;
}
