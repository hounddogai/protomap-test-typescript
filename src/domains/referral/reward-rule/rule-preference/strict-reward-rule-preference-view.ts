import * as text from "../../../../kit/text.js";
import { StrictRewardRulePreference } from "./strict-reward-rule-preference.js";

/** How screens and exports show a strict reward rule preference. */
export class StrictRewardRulePreferenceView {
  code: string;
  label: string;
  retries: string;
  variant: string;
  visible: string;
  checksum: string;
  journeyId: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    retries: string,
    variant: string,
    visible: string,
    checksum: string,
    journeyId: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.variant = variant;
    this.visible = visible;
    this.checksum = checksum;
    this.journeyId = journeyId;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toStrictRewardRulePreferenceView(item: StrictRewardRulePreference): StrictRewardRulePreferenceView {
  return new StrictRewardRulePreferenceView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 64),
    String(item.retries),
    item.variant,
    `${item.visible}`,
    item.checksum,
    item.journeyId,
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictRewardRulePreferenceViews(items: StrictRewardRulePreference[]): StrictRewardRulePreferenceView[] {
  const views: StrictRewardRulePreferenceView[] = [];
  for (const item of items) {
    views.push(toStrictRewardRulePreferenceView(item));
  }
  return views;
}

export function sumStrictRewardRulePreferenceView(view: StrictRewardRulePreferenceView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedRetries + parsedOpenRate;
}
