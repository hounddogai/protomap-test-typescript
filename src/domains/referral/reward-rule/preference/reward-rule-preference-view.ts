import { RewardRulePreference } from "./reward-rule-preference.js";

/** How screens and exports show a reward rule preference. */
export class RewardRulePreferenceView {
  code: string;
  name: string;
  sourceText: string;
  sequence: string;
  startsAt: string;
  priorityText: string;
  checksum: string;
  country: string;
  thresholdText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    sourceText: string,
    sequence: string,
    startsAt: string,
    priorityText: string,
    checksum: string,
    country: string,
    thresholdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.sourceText = sourceText;
    this.sequence = sequence;
    this.startsAt = startsAt;
    this.priorityText = priorityText;
    this.checksum = checksum;
    this.country = country;
    this.thresholdText = thresholdText;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRulePreferenceView(item: RewardRulePreference): RewardRulePreferenceView {
  return new RewardRulePreferenceView(
    item.code,
    item.name,
    item.source,
    String(item.sequence),
    String(item.startsAt),
    String(item.priority),
    item.checksum,
    item.country,
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRulePreferenceViews(items: RewardRulePreference[]): RewardRulePreferenceView[] {
  const views: RewardRulePreferenceView[] = [];
  for (const item of items) {
    views.push(toRewardRulePreferenceView(item));
  }
  return views;
}

export function sumRewardRulePreferenceView(view: RewardRulePreferenceView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedSequence + parsedStartsAt + parsedPriority;
}
