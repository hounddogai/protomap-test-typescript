import * as text from "../../../../kit/text.js";
import { RewardProfile } from "./reward-profile.js";

/** How screens and exports show a reward profile. */
export class RewardProfileView {
  code: string;
  label: string;
  cohort: string;
  version: string;
  frequencyCapText: string;
  openRate: string;
  campaignRefText: string;
  batchSize: string;
  categoryText: string;
  externalRefText: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    cohort: string,
    version: string,
    frequencyCapText: string,
    openRate: string,
    campaignRefText: string,
    batchSize: string,
    categoryText: string,
    externalRefText: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.version = version;
    this.frequencyCapText = frequencyCapText;
    this.openRate = openRate;
    this.campaignRefText = campaignRefText;
    this.batchSize = batchSize;
    this.categoryText = categoryText;
    this.externalRefText = externalRefText;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toRewardProfileView(item: RewardProfile): RewardProfileView {
  return new RewardProfileView(
    item.code,
    item.label,
    item.cohort,
    String(item.version),
    String(item.frequencyCap),
    item.openRate.toFixed(2),
    item.campaignRef,
    String(item.batchSize),
    text.truncate(item.category, 80),
    item.externalRef,
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardProfileViews(items: RewardProfile[]): RewardProfileView[] {
  const views: RewardProfileView[] = [];
  for (const item of items) {
    views.push(toRewardProfileView(item));
  }
  return views;
}

export function sumRewardProfileView(view: RewardProfileView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedVersion + parsedFrequencyCap + parsedOpenRate;
}
